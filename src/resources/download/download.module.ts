import { Module } from '@nestjs/common';
import { DownloadService } from './download.service';
import { DownloadController } from './download.controller';
import { S3Client } from '@aws-sdk/client-s3';

@Module({
  providers: [DownloadService, S3Client],
  controllers: [DownloadController],
  exports: [DownloadService],
})
export class DownloadModule {}
