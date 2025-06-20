import { registerAs, ConfigModuleOptions } from '@nestjs/config';
import * as Joi from 'joi';
import {
  BotConfigs,
  CommonConfigs,
  DatabaseConfigs,
  PaymentConfigs,
  RedisConfigs,
  StorageConfigs,
  ThrottlerConfigs,
} from '../types';

const common = registerAs<CommonConfigs>('common', () => ({
  port: +process.env.PORT,
  env: process.env.NODE_ENV,
  secret: process.env.JWT_SECRET,
  pricePerMinute: +process.env.PRICE_PER_MINUTE,
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
  domain: process.env.STORAGE_DOMAIN,
  user: process.env.STORAGE_ROOT_USER,
  password: process.env.STORAGE_ROOT_PASSWORD,
  bucketName: process.env.STORAGE_S3_BUCKET_NAME,
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
  region: process.env.STORAGE_S3_REGION,
}));

const bot = registerAs<BotConfigs>('bot', () => ({
  token: process.env.BOT_TOKEN,
  botUrl: process.env.BOT_URL,
}));

const payment = registerAs<PaymentConfigs>('payment', () => ({
  accountId: +process.env.YOOMONEY_ACCOUNT_ID,
  secretKey: process.env.YOOMONEY_SECRET_KEY,
  apiUrl: process.env.YOOMONEY_API_URL,
}));

export const EnvConfig: ConfigModuleOptions = {
  envFilePath: '.env',
  isGlobal: true,
  validationSchema: Joi.object({
    PORT: Joi.string().required(),
    PRICE_PER_MINUTE: Joi.number().optional(),
    DB_TYPE: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),
    STORAGE_DOMAIN: Joi.string().required(),
    STORAGE_ROOT_USER: Joi.string().required(),
    STORAGE_ROOT_PASSWORD: Joi.string().required(),
    STORAGE_S3_BUCKET_NAME: Joi.string().required(),
    STORAGE_ACCESS_KEY_ID: Joi.string().required(),
    STORAGE_SECRET_ACCESS_KEY: Joi.string().required(),
    STORAGE_S3_REGION: Joi.string().required(),
    BOT_TOKEN: Joi.string().required(),
    BOT_URL: Joi.string().required(),
    YOOMONEY_ACCOUNT_ID: Joi.number().required(),
    YOOMONEY_SECRET_KEY: Joi.string().required(),
    YOOMONEY_API_URL: Joi.string().required(),
  }),
  load: [common, database, redis, throttler, storage, bot, payment],
};
