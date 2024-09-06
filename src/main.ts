import { NestFactory } from '@nestjs/core';
import { AppModule } from '@resources/app.module';
import { ConfigService } from '@nestjs/config';
import { CommonConfigs } from '@core/types';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TariffService } from './resources/tariff/tariff.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const { port, pricePerMinute } = app.get(ConfigService).get<CommonConfigs>('common');

  const logger = new Logger(AppModule.name);

  // Init tariff per minute
  const tariffService = app.get(TariffService);

  const existingTariff = await tariffService.getTariff();
  if (!existingTariff) {
    await tariffService.updateTariff(pricePerMinute && 5);
    logger.warn(`Tariff initialized successfully: ${pricePerMinute && 5}`);
  } else {
    logger.warn(`Tariff already exists: ${existingTariff.pricePerMinute}`);
  }

  app.useGlobalPipes(new ValidationPipe());

  app.disable('x-powered-by', 'X-Powered-By');

  await app.listen(port, async () =>
    logger.log(`app was running on ${await app.getUrl()}`),
  );
}
bootstrap();
