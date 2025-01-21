import { Module } from '@nestjs/common';
import { TariffService } from './tariff.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tariff } from './entities';
import { EntityService } from '@core/services';
import { CacheConfig } from '@core/configs';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisClientOptions } from 'redis';

@Module({
  imports: [
    CacheModule.registerAsync<RedisClientOptions>(CacheConfig),
    TypeOrmModule.forFeature([Tariff]),
  ],
  providers: [TariffService, EntityService],
  exports: [TariffService],
})
export class TariffModule {}
