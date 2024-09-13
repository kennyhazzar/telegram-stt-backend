import { Module } from '@nestjs/common';
import { MainUpdate, StartUpdate } from './updates';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user'

@Module({
  imports: [
    UserModule,
    ConfigModule,
  ],
  providers: [MainUpdate, StartUpdate],
})
export class TelegramModule {}
