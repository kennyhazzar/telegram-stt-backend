import { Process, Processor } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { MinioService } from 'nestjs-minio-client';
import { FileMimeType, JobDownload, StorageConfigs } from '@core/types';
import getVideoDurationInSeconds from 'get-video-duration';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import { BadRequestException, Inject, Logger } from '@nestjs/common';
import axios from 'axios';
import * as ytdl from '@distube/ytdl-core';
import { DownloadService } from './download.service';
import { Job } from 'bull';
import { DownloadStatusEnum } from './entities';
import { Cache } from 'cache-manager';
import { UpdateDownloadDto } from './dto';
import { DeepPartial } from 'typeorm';
import { BalanceService } from '@resources/balance/balance.service';

@Processor('download_queue')
export class DownloadConsumer {
  private readonly MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1 GB
  private logger = new Logger(DownloadConsumer.name);

  constructor(
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
    private readonly downloadService: DownloadService,
    private readonly balanceService: BalanceService,
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
  ) {}

  @Process('ytdl_audio')
  async downloadFromYoutubeAsAudio(job: Job<JobDownload>): Promise<any> {
    const { downloadId, url, userId } = job.data;

    try {
      const videoId = ytdl.getVideoID(url);

      const cacheKey = `ytdl_info_${videoId}`;

      let info = await this.cacheManager.get<ytdl.videoInfo>(cacheKey);

      if (!info) {
        info = await ytdl.getInfo(url);

        await this.cacheManager.set(cacheKey, info, { ttl: 600 } as any);
      }

      await this.downloadService.updateDownload(downloadId, {
        title: info?.player_response?.videoDetails?.title,
      });

      const audioFormat = ytdl.chooseFormat(info.formats, {
        filter: 'audioonly',
        quality: 'lowestaudio',
      });
      if (!audioFormat) {
        throw new BadRequestException('No suitable audio format found');
      }

      if (audioFormat?.url) {
        const { buffer, mimeType } = await this.fetchFileAsBuffer(
          audioFormat.url,
        );

        const filename = `${randomUUID()}.mp3`;
        return this.uploadToS3(buffer, filename, mimeType, downloadId, userId);
      } else {
        throw new BadRequestException('Error fetch file as buffer');
      }
    } catch (error) {
      this.logger.error(
        `Failed to download audio from YouTube: ${error.message}`,
      );
      await this.downloadService.updateDownload(downloadId, {
        error: 'Error downloading and uploading audio from YouTube', //TODO: добавить сохранеие жзона
        status: DownloadStatusEnum.ERROR,
      });
      throw new BadRequestException(
        'Error downloading and uploading audio from YouTube',
      );
    }
  }

  @Process('google_drive')
  async downloadFromGoogleDrive(job: Job<JobDownload>) {
    const { downloadId, fileId, userId } = job.data;

    const { mimeType, buffer, title } = await this.validateCloudFile(
      fileId,
      'google',
    );

    if (title) {
      await this.downloadService.updateDownload(downloadId, {
        title,
      });
    }

    try {
      return this.uploadToS3(
        buffer,
        `${randomUUID()}.${FileMimeType[mimeType]}`,
        mimeType,
        downloadId,
        userId,
      );
    } catch (error) {
      this.logger.error(error);
      await this.downloadService.updateDownload(downloadId, {
        error: 'Failed to download file from Google Drive', //TODO: добавить сохранеие жзона
        status: DownloadStatusEnum.ERROR,
      });
      throw new BadRequestException(
        'Failed to download file from Google Drive',
      );
    }
  }

  async validateCloudFile(fileId: string, type: 'google' | 'yandex') {
    try {
      let fileUrl: string = '';

      if (type === 'google') {
        fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      } else if (type === 'yandex') {
        fileUrl = fileId;
      }

      const response = await this.fetchFileAsBuffer(fileUrl);

      const validMimeTypes = [
        'video/mp4',
        'audio/mpeg',
        'audio/mp3',
        'video/x-msvideo',
      ];
      if (!validMimeTypes.includes(response?.mimeType)) {
        throw new BadRequestException(
          'Invalid file type. Only video or audio files are allowed.',
        );
      }

      if (response?.size > this.MAX_FILE_SIZE) {
        throw new BadRequestException(
          'File is too large. Maximum size allowed is 1GB.',
        );
      }

      return {
        mimeType: response?.mimeType,
        size: response?.size,
        buffer: response.buffer,
        title: response?.title,
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Failed to validate Google Drive file');
    }
  }

  @Process('yandex_disk')
  async downloadFromYandexDisk(job: Job<JobDownload>) {
    try {
      const { downloadId, url, userId } = job.data;

      const getDownloadLinkUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(url)}`;

      const linkResponse = await axios.get(getDownloadLinkUrl);
      const downloadLink = linkResponse.data.href;

      if (!downloadLink) {
        throw new BadRequestException(
          'Failed to get download link from Yandex Disk',
        );
      }

      const { mimeType, buffer, title } = await this.validateCloudFile(
        url,
        'yandex',
      );

      if (title) {
        await this.downloadService.updateDownload(downloadId, {
          title,
        });
      }

      try {
        return this.uploadToS3(
          buffer,
          `${randomUUID()}.${FileMimeType[mimeType]}`,
          mimeType,
          downloadId,
          userId,
        );
      } catch (error) {
        this.logger.error(error);
        await this.downloadService.updateDownload(downloadId, {
          error: 'Failed to download file from Yandex Disk',
          status: DownloadStatusEnum.ERROR,
        });
        throw new BadRequestException(
          'Failed to download file from Yandex Disk',
        );
      }
    } catch (error) {
      throw new BadRequestException('Failed to download file from Yandex Disk');
    }
  }

  private async fetchFileAsBuffer(fileUrl: string) {
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream',
    });

    let title: string;

    try {
      const contentDisposition = response.headers[
        'content-disposition'
      ] as string;

      title = this.extractFilename(contentDisposition);
    } catch (error) {
      console.log(error);
    }

    const size = parseInt(response.headers['content-length'], 10);
    const mimeType = response.headers['content-type'];

    const chunks = [];

    response.data.on('data', (chunk) => {
      chunks.push(chunk);
    });

    await new Promise((resolve, reject) => {
      response.data.on('end', resolve);
      response.data.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);

    return { buffer, mimeType, size, title };
  }

  @Process('upload_file')
  async uploadFile(payload: Job<JobDownload>) {
    const { buffer, mimetype, downloadId, userId } = payload.data;

    await this.downloadService.updateDownload(downloadId, {
      status: DownloadStatusEnum.PROCESSING,
    });

    return this.uploadToS3(
      Buffer.from(buffer),
      `${randomUUID()}.${FileMimeType[mimetype]}`,
      mimetype,
      downloadId,
      userId,
    );
  }

  private async uploadToS3(
    file: Buffer,
    filename: string,
    mimetype: string,
    downloadId: string,
    userId: string,
  ) {
    try {
      const { bucketName } = this.configService.get<StorageConfigs>('storage');

      const duration = await getVideoDurationInSeconds(Readable.from(file));

      const isPassedResult = await this.balanceService.calculateCost(
        duration,
        userId,
      );

      const metaData = {
        'Content-Type': mimetype,
        duration,
      };
      await this.minioService.client.putObject(
        bucketName,
        filename,
        file,
        Buffer.byteLength(file),
        metaData,
      );

      let payload: DeepPartial<UpdateDownloadDto> = {
        filename,
        status: DownloadStatusEnum.DONE,
        duration,
      };

      await this.downloadService.updateDownload(downloadId, payload);

      return {
        filename,
        duration,
        price: isPassedResult.totalCost,
        message: 'Файл успешно загружен',
      };
    } catch (error) {
      this.logger.error(error);

      await this.downloadService.updateDownload(downloadId, {
        status: DownloadStatusEnum.ERROR,
        error: 'Error Minio upload',
      });
    }
  }

  private extractFilename(contentDisposition: string): string {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (!filenameMatch || filenameMatch.length < 2) {
      throw new Error('Filename not found in Content-Disposition header');
    }

    const encodedFilename = filenameMatch[1];

    const buffer = Buffer.from(encodedFilename, 'binary');
    const decodedFilename = buffer.toString('utf-8');

    return decodedFilename;
  }
}
