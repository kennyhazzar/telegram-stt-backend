import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonConfigs } from '../types';

export const JwtConfig = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<CommonConfigs>('common').secret || 'secretKey',
    signOptions: { expiresIn: '1h' },
    global: true,
  }),
  inject: [ConfigService],
};
