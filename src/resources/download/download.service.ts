import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { MinioService } from 'nestjs-minio-client';
import { Readable } from 'stream';
import getVideoDurationInSeconds from 'get-video-duration';
import { randomUUID } from 'crypto';
import { FileMimeType, StorageConfigs } from '@core/types';
import * as ytdl from 'ytdl-core';

@Injectable()
export class DownloadService {
  private readonly MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1 GB

  constructor(
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {}

  async uploadToS3(
    file: Buffer,
    filename: string,
    mimetype: string,
    size?: number,
  ) {
    const { bucketName } = this.configService.get<StorageConfigs>('storage');

    const duration = await getVideoDurationInSeconds(Readable.from(file));

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
    return {
      filename,
      duration,
      message: 'File uploaded successfully',
    };
  }

  async downloadFromGoogleDrive(fileId: string) {
    const { mimeType, buffer } = await this.validateGoogleDriveFile(fileId);

    try {
      return this.uploadToS3(
        buffer,
        `${randomUUID()}.${FileMimeType[mimeType]}`,
        mimeType,
      );
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        'Failed to download file from Google Drive',
      );
    }
  }

  async validateGoogleDriveFile(fileId: string) {
    try {
      const fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

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
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to validate Google Drive file');
    }
  }

  async downloadFromYandexDisk(publicUrl: string): Promise<string> {
    try {
      const getDownloadLinkUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}`;

      const linkResponse = await axios.get(getDownloadLinkUrl);
      const downloadLink = linkResponse.data.href;

      if (!downloadLink) {
        throw new BadRequestException(
          'Failed to get download link from Yandex Disk',
        );
      }

      const filePath = path.join(__dirname, 'temp', `${Date.now()}.file`);
      const response = await axios({
        url: downloadLink,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      return 'string)';

      // const writer = fs.createWriteStream(filePath);
      // response.data.pipe(writer);

      // await new Promise((resolve, reject) => {
      //   writer.on('finish', resolve);
      //   writer.on('error', reject);
      // });

      // return this.uploadToS3(filePath, `${Date.now()}.file`);
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

    return { buffer, mimeType, size };
  }

  async downloadFromYoutubeAsAudio(url: string) {
    const response = await ytdl.getInfo(url);

    console.log({ response }); //! CAREFULLY THIS IS DEBUGGGG

    return { response };
  }
}
