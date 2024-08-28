import { NestFactory } from '@nestjs/core';
import { AppModule } from '@resources/app.module';
import { ConfigService } from '@nestjs/config';
import { CommonConfigs } from '@core/types';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const { port } = app.get(ConfigService).get<CommonConfigs>('common');

  app.useGlobalPipes(new ValidationPipe());

  app.disable('x-powered-by', 'X-Powered-By');

  await app.listen(port, async () =>
    console.log(`app was running on ${await app.getUrl()}`),
  );
}
bootstrap();
