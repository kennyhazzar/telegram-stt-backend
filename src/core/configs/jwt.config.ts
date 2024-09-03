import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonConfigs } from '../types';

export const JwtConfig = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<CommonConfigs>('common').secret || 'secretKey',
    global: true,
  }),
  inject: [ConfigService],
};
