import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceService } from './balance.service';
import { BalanceController } from './balance.controller';
import { Balance } from './entities/balance.entity';
import { UserModule } from '../user';
import { EntityService } from '@core/services';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfig, JwtConfig } from '@core/configs';
import { RedisClientOptions } from 'redis';
import { JwtModule } from '@nestjs/jwt';
import { Payment, PaymentStatus } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Balance, PaymentStatus, Payment]),
    UserModule,
    JwtModule.registerAsync(JwtConfig),
    CacheModule.registerAsync<RedisClientOptions>(CacheConfig),
  ],
  providers: [BalanceService, EntityService],
  controllers: [BalanceController],
  exports: [BalanceService],
})
export class BalanceModule {}
