import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvConfig, ThrottlerConfig, TypeormConfig } from '@core/configs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { BalanceModule } from './balance/balance.module';
import { DownloadModule } from './download/download.module';
import { TaskModule } from './tasks/task.module';
import { TranscriptionModule } from './transcription/transcription.module';
import { UserModule } from './user/user.module';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot(EnvConfig),
    TypeOrmModule.forRootAsync(TypeormConfig),
    ThrottlerModule.forRootAsync(ThrottlerConfig),
    AuthModule,
    BalanceModule,
    DownloadModule,
    TaskModule,
    TranscriptionModule,
    UserModule,
    FileModule,
  ],
})
export class AppModule {}
