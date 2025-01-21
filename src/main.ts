import { NestFactory } from '@nestjs/core';
import { AppModule } from '@resources/app.module';
import { ConfigService } from '@nestjs/config';
import { CommonConfigs } from '@core/types';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TariffService } from './resources/tariff/tariff.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const { port } = app.get(ConfigService).get<CommonConfigs>('common');

  const logger = new Logger(AppModule.name);

  // Init tariff per minute
  const tariffService = app.get(TariffService);

  const existingTariff = await tariffService.getTariff();
  logger.warn(`Tariff: ${existingTariff.pricePerMinute}`);

  app.useGlobalPipes(new ValidationPipe());

  app.disable('x-powered-by', 'X-Powered-By');

  await app.listen(port, async () =>
    logger.log(`app was running on ${await app.getUrl()}`),
  );
}
bootstrap();
