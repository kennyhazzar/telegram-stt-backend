import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TelegrafModuleAsyncOptions,
  TelegrafModuleOptions,
} from 'nestjs-telegraf';
import { BotConfigs } from '../types';

export const TelegrafConfig: TelegrafModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (
    configService: ConfigService,
  ): Promise<TelegrafModuleOptions> => {
    const { token } = configService.get<BotConfigs>('bot');

    return {
      token,
    };
  },
};
