import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LessThan, Repository } from 'typeorm';
import { MinioService } from 'nestjs-minio-client';
import { Cron } from '@nestjs/schedule';
import { subHours } from 'date-fns';
import { DownloadService } from './download.service';
import { EntityService } from '@core/services';
import { Download, DownloadStatusEnum } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { StorageConfigs } from '@core/types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DownloadCleanupService implements OnModuleInit {
  private readonly logger = new Logger(DownloadCleanupService.name);

  constructor(
    @InjectRepository(Download)
    private readonly downloadRepository: Repository<Download>,
    private readonly minioService: MinioService,
    private readonly downloadService: DownloadService,
    private readonly entityService: EntityService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.warn('Running initial cleanup of expired files in MinIO...');
    await this.handleCron();
  }

  @Cron('0 * * * *')
  async handleCron() {
    this.logger.log('Running scheduled cleanup of expired files in MinIO...');

    const now = new Date();

    const doneExpiration = subHours(now, 24);

    const expiredDownloads = await this.entityService.findMany({
      repository: this.downloadRepository,
      cacheValue: '',
      where: [
        {
          status: DownloadStatusEnum.DONE,
          updatedAt: LessThan(doneExpiration),
        },
      ],
      bypassCache: true,
    });

    for (const download of expiredDownloads) {
      try {
        if (download.filename) {
          const { bucketName } = this.configService.get<StorageConfigs>('storage');

          await this.minioService.client.removeObject(
            bucketName,
            download.filename,
          );
          this.logger.warn(`Deleted file: ${download.filename}`);
        }

        download.status = DownloadStatusEnum.EXPIRED;
        await this.downloadRepository.save(download);

        await this.downloadService.updateDownload(download.id, {
          status: DownloadStatusEnum.EXPIRED,
          error: 'Файл удален по истечению срока хранения',
        });
      } catch (error) {
        this.logger.error(`Error deleting file ${download.filename}:`, error);
      }
    }
  }
}
