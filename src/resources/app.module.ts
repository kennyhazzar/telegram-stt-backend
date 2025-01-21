import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BullConfig,
  EnvConfig,
  TelegrafConfig,
  ThrottlerConfig,
  TypeormConfig,
} from '@core/configs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { BalanceModule } from './balance/balance.module';
import { DownloadModule } from './download/download.module';
import { TaskModule } from './tasks/task.module';
import { TranscriptionModule } from './transcription/transcription.module';
import { UserModule } from './user/user.module';
import { TariffModule } from './tariff/tariff.module';
import { BullModule } from '@nestjs/bull';
import {
  RequestLoggerMiddleware,
  RequestLogService,
} from '@resources/middlewares';
import { RequestLog } from './middlewares/request-logger/entities';
import { TelegramModule } from './telegram/telegram.module';
import { TelegrafModule } from 'nestjs-telegraf';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot(EnvConfig),
    TypeOrmModule.forRootAsync(TypeormConfig),
    ThrottlerModule.forRootAsync(ThrottlerConfig),
    BullModule.forRootAsync(BullConfig),
    AuthModule,
    BalanceModule,
    DownloadModule,
    TaskModule,
    TranscriptionModule,
    UserModule,
    TariffModule,
    TelegrafModule.forRootAsync(TelegrafConfig),
    TelegramModule,
    TypeOrmModule.forFeature([RequestLog]),
    PaymentsModule,
  ],
  providers: [RequestLogService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
