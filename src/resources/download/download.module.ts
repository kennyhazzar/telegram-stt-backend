import { Module } from '@nestjs/common';
import { DownloadService } from './download.service';
import { DownloadController } from './download.controller';
import { MinioModuleConfig } from '@core/configs';
import { MinioModule } from 'nestjs-minio-client';

@Module({
  imports: [
    MinioModule.registerAsync(MinioModuleConfig),
  ],
  providers: [DownloadService],
  controllers: [DownloadController],
  exports: [DownloadService],
})
export class DownloadModule {}
