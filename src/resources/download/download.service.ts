import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EntityService } from '@core/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Download, DownloadSourceEnum, DownloadStatusEnum } from './entities';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { CreateDownloadDto, UpdateDownloadDto } from './dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JobDownload, MessageDownloadEnum } from '@core/types';

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
      message: MessageDownloadEnum.DOWNLOAD_ADDED_TO_QUEUE,
    });

    try {
      //TODO: всрато все это выглядит, надо позже переделать
      if (url.includes('drive.google.com')) {
        const fileId = this.extractGoogleDriveFileId(url);

        download = await this.updateDownload(download.id, {
          status: DownloadStatusEnum.PROCESSING,
          source: DownloadSourceEnum.GOOGLE_DRIVE,
          message: 'Загрузка файла...',
        });

        await this.downloadQueue.add('google_drive', {
          downloadId: download.id,
          fileId,
          url,
          userId,
        });
      } else if (url.includes('yadi.sk') || url.includes('disk.yandex.ru')) {
        download = await this.updateDownload(download.id, {
          source: DownloadSourceEnum.YANDEX_DISK,
          status: DownloadStatusEnum.REJECTED,
          message: 'Ошибка загрузки файла: Яндекс не поддерживается',
          url,
        });

        //TODO: до лучших времен
        // await this.downloadQueue.add('yandex_disk', {
        //   downloadId: download.id,
        //   url,
        //   userId,
        // });
      } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        download = await this.updateDownload(download.id, {
          source: DownloadSourceEnum.YOUTUBE,
          status: DownloadStatusEnum.PROCESSING,
          message: 'Загрузка файла...',
        });

        await this.downloadQueue.add('ytdl_audio', {
          downloadId: download.id,
          url,
          userId,
        });
      } else {
        await this.updateDownload(download.id, {
          status: DownloadStatusEnum.ERROR,
          error: 'Unsupported URL',
          message: 'Ошибка загрузки файла: Неподдерживаемый URL-адрес',
        });

        throw new BadRequestException(
          'Ошибка загрузки файла: Неподдерживаемый URL-адрес',
        );
      }

      return {
        downloadId: download.id,
        message: MessageDownloadEnum.DOWNLOAD_ADDED_TO_QUEUE,
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Ошибка загрузки файла');
    }
  }

  async addUploadToQueue(
    userId: string,
    payload: Partial<JobDownload>,
  ): Promise<Download> {
    const download = await this.createDownload({
      userId,
      source: DownloadSourceEnum.UPLOAD,
      title: payload.title,
      message: MessageDownloadEnum.DOWNLOAD_ADDED_TO_QUEUE,
    });

    this.downloadQueue.add('upload_file', {
      ...payload,
      downloadId: download.id,
      userId,
    });

    return download;
  }

  async getDownload(where: {
    id: string;
    userId: string;
    status?: DownloadStatusEnum;
  }) {
    const wherePayload: FindOptionsWhere<Download> = {
      id: where.id,
      user: {
        id: where.userId,
      },
    };

    if (where.status) {
      wherePayload.status = where.status;
    }

    return this.entityService.findOne({
      repository: this.downloadRepository,
      cacheValue: where.id,
      where: wherePayload,
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
        ttlExpiresAt: true,
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
        ttlExpiresAt: dl.ttlExpiresAt,
      }),
    });
  }

  async createDownload({
    source,
    url,
    userId,
    title,
    message,
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
        message,
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
        },
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
      order: {
        createdAt: 'desc',
      },
    });
  }

  private extractGoogleDriveFileId(url: string): string {
    const match = url.match(/\/d\/(.*?)(\/|$)/);

    if (!match || !match[1]) {
      throw new BadRequestException('Invalid Google Drive URL');
    }
    return match[1];
  }
}
