import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import { MinioService } from 'nestjs-minio-client';
import { fileInterceptorConfig } from '@core/configs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MinioFileInterceptor implements NestInterceptor {
  constructor(
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {}

  intercept<T>(context: ExecutionContext, next: CallHandler): Observable<T> {
    const fileInterceptor = FileInterceptor(
      'file',
      fileInterceptorConfig(this.minioService, this.configService),
    );
    const callInterceptor = new (fileInterceptor as any)();
    return callInterceptor.intercept(context, next);
  }
}
