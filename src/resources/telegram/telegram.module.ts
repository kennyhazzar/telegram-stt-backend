import { Module } from '@nestjs/common';
import { MainUpdate, StartUpdate } from './updates';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfig } from '@core/configs';
import { PaymentsModule } from '../payments/payments.module';
import { BalanceModule } from '../balance/balance.module';

@Module({
  imports: [
    UserModule,
    PaymentsModule,
    BalanceModule,
    ConfigModule,
    JwtModule.registerAsync(JwtConfig),
  ],
  providers: [MainUpdate, StartUpdate],
})
export class TelegramModule {}
