import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EntityService } from '@core/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Download, DownloadSourceEnum, DownloadStatusEnum } from './entities';
import { DeepPartial, Repository } from 'typeorm';
import { CreateDownloadDto, UpdateDownloadDto } from './dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JobDownload } from '@core/types';

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  constructor(
    @InjectRepository(Download)
    private readonly downloadRepository: Repository<Download>,
    @InjectQueue('download_queue') private downloadQueue: Queue<JobDownload>,
    private readonly entityService: EntityService,
  ) {}

  async addJobToQueue(url: string, userId: string) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    let download = await this.createDownload({
      url,
      userId,
    });

    try {
      //TODO: всрато все это выглядит, надо позже переделать
      if (url.includes('drive.google.com')) {
        const fileId = this.extractGoogleDriveFileId(url);

        download = await this.updateDownload(download.id, {
          status: DownloadStatusEnum.PROCESSING,
          source: DownloadSourceEnum.GOOGLE_DRIVE,
        });

        await this.downloadQueue.add('google_drive', {
          downloadId: download.id,
          fileId,
          url,
        });
      } else if (url.includes('yadi.sk') || url.includes('disk.yandex.ru')) {
        download = await this.updateDownload(download.id, {
          status: DownloadStatusEnum.REJECTED,
          source: DownloadSourceEnum.YANDEX_DISK,
          error: 'не сделал пока сори',
        });

        //TODO: яндекс пока не реализован, не тестировал(
      } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        download = await this.updateDownload(download.id, {
          source: DownloadSourceEnum.YOUTUBE,
          status: DownloadStatusEnum.PROCESSING,
        });

        await this.downloadQueue.add('ytdl_audio', {
          downloadId: download.id,
          url,
        });
      } else {
        await this.updateDownload(download.id, {
          status: DownloadStatusEnum.ERROR,
          error: 'Unsupported URL',
        });

        throw new BadRequestException('Unsupported URL');
      }

      return {
        downloadId: download.id,
        message: 'Download was added to queue successfully',
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Failed to process the file');
    }
  }

  async addUploadToQueue(userId: string, payload: Partial<JobDownload>): Promise<Download> {
    const download = await this.createDownload({
      userId,
      source: DownloadSourceEnum.UPLOAD,
      title: payload.title,
    });

    this.downloadQueue.add('upload_file', {
      ...payload,
      downloadId: download.id,
    });

    return download;
  }

  async getDownload(where: { id: string; userId: string }) {
    return this.entityService.findOne({
      repository: this.downloadRepository,
      cacheValue: where.id,
      where: {
        id: where.id,
        user: {
          id: where.userId,
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        url: true,
        duration: true,
        source: true,
        createdAt: true,
        updatedAt: true,
        error: true,
      },
      transform: (dl) => ({
        id: dl.id,
        title: dl.title,
        status: dl.status,
        url: dl.url,
        duration: dl.duration ? +dl.duration : null,
        source: dl.source,
        createdAt: dl.createdAt,
        updatedAt: dl.updatedAt,
        error: dl.error,
      }),
    });
  }

  async createDownload({
    source,
    url,
    userId,
    title,
  }: DeepPartial<CreateDownloadDto>) {
    return this.entityService.save<Download>({
      repository: this.downloadRepository,
      payload: {
        source,
        url,
        user: {
          id: userId,
        },
        title,
      },
      cacheValue: ({ id }) => id,
    });
  }

  async updateDownload(id: string, payload: DeepPartial<UpdateDownloadDto>) {
    const download = await this.downloadRepository.preload({
      id,
      ...payload,
    });

    if (!download) {
      throw new Error('Download not found');
    }

    const updateResult = await this.entityService.update({
      payload: download,
      repository: this.downloadRepository,
      cacheValue: ({ id }) => id,
    });
    return updateResult;
  }

  async getDownloadStatuses(userId: string) {
    return this.downloadRepository.find({
      where: {
        user: {
          id: userId,
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        url: true,
        duration: true,
        source: true,
        createdAt: true,
        updatedAt: true,
        error: true,
      }
    })
  }

  private extractGoogleDriveFileId(url: string): string {
    const match = url.match(/\/d\/(.*?)(\/|$)/);

    if (!match || !match[1]) {
      throw new BadRequestException('Invalid Google Drive URL');
    }
    return match[1];
  }
}
