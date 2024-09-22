import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { EntityService } from '@core/services';
import { UserModule } from '../user';
import { TariffModule } from '../tariff/tariff.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfig, JwtConfig } from '@core/configs';
import { RedisClientOptions } from 'redis';
import { BalanceModule } from '../balance/balance.module';
import { DownloadModule } from '../download/download.module';
import { PaymentsModule } from '../payments/payments.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Task]),
  CacheModule.registerAsync<RedisClientOptions>(CacheConfig),
  JwtModule.registerAsync(JwtConfig),
  UserModule,
  TariffModule,
  BalanceModule,
  DownloadModule,
  PaymentsModule,
],
  providers: [TaskService, EntityService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule {}
