import { Module } from '@nestjs/common';
import { MainUpdate, StartUpdate } from './updates';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfig } from '@core/configs';

@Module({
  imports: [UserModule, ConfigModule, JwtModule.registerAsync(JwtConfig)],
  providers: [MainUpdate, StartUpdate],
})
export class TelegramModule {}
