import { Module } from '@nestjs/common';
import { DownloadService } from './download.service';
import { DownloadController } from './download.controller';
import { CacheConfig, JwtConfig, MinioModuleConfig } from '@core/configs';
import { MinioModule } from 'nestjs-minio-client';
import { BullModule } from '@nestjs/bull';
import { DownloadConsumer } from './download.processor';
import { EntityService, MediaService } from '@core/services';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Download } from './entities';
import { RedisClientOptions } from 'redis';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@resources/user/user.module';
import { TariffModule } from '../tariff/tariff.module';
import { DownloadCleanupService } from './download.clean-up.service';
import { BalanceModule } from '../balance/balance.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    UserModule,
    TariffModule,
    TypeOrmModule.forFeature([Download]),
    CacheModule.registerAsync<RedisClientOptions>(CacheConfig),
    BullModule.registerQueueAsync({ name: 'download_queue' }),
    MinioModule.registerAsync(MinioModuleConfig),
    JwtModule.registerAsync(JwtConfig),
    BalanceModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    DownloadService,
    EntityService,
    MediaService,
    DownloadConsumer,
    DownloadCleanupService,
  ],
  controllers: [DownloadController],
  exports: [DownloadService],
})
export class DownloadModule {}
