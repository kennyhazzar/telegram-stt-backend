import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment, PaymentStatus } from './entities';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfig } from '@core/configs';
import { RedisClientOptions } from 'redis';
import { EntityService } from '@core/services';
import { BalanceModule } from '../balance/balance.module';
import { UserModule } from '../user';

@Module({
  imports: [
    BalanceModule,
    UserModule,
    HttpModule,
    TypeOrmModule.forFeature([Payment, PaymentStatus]),
    CacheModule.registerAsync<RedisClientOptions>(CacheConfig),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, EntityService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
