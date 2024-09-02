import { registerAs, ConfigModuleOptions } from '@nestjs/config';
import * as Joi from 'joi';
import {
  CommonConfigs,
  DatabaseConfigs,
  RedisConfigs,
  StorageConfigs,
  ThrottlerConfigs,
} from '../types';

const common = registerAs<CommonConfigs>('common', () => ({
  port: +process.env.PORT,
  env: process.env.NODE_ENV,
  secret: process.env.JWT_SECRET,
}));

const database = registerAs<DatabaseConfigs>('db', () => ({
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  name: process.env.DB_NAME,
}));

const redis = registerAs<RedisConfigs>('redis', () => ({
  host: process.env.REDIS_HOST,
  port: +process.env.REDIS_PORT,
}));

const throttler = registerAs<ThrottlerConfigs>('throttler', () => ({
  ttl: +process.env.THROTTLE_TTL,
  limit: +process.env.THROTTLE_LIMIT,
}));

const storage = registerAs<StorageConfigs>('storage', () => ({
  domain: process.env.MINIO_DOMAIN,
  user: process.env.MINIO_ROOT_USER,
  password: process.env.MINIO_ROOT_PASSWORD,
}));

export const EnvConfig: ConfigModuleOptions = {
  envFilePath: '.env',
  isGlobal: true,
  validationSchema: Joi.object({
    PORT: Joi.string().required(),
    DB_TYPE: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),
  }),
  load: [common, database, redis, throttler, storage],
};
