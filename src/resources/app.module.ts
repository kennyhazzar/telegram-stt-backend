import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BullConfig,
  EnvConfig,
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
import { FileModule } from './file/file.module';
import { TariffModule } from './tariff/tariff.module';
import { BullModule } from '@nestjs/bull';

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
    FileModule,
    TariffModule,
  ],
})
export class AppModule {}
