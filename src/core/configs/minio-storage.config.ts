import { Injectable } from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';
import { Request } from 'express';
import { StorageEngine } from 'multer';
import { extname } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageConfigs } from '../types';
import { Readable } from 'typeorm/platform/PlatformTools';
import getVideoDurationInSeconds from 'get-video-duration';
import { randomUUID } from 'crypto';

@Injectable()
export class MinioStorage implements StorageEngine {
  constructor(private readonly minioService: MinioService) {}

  _handleFile(req: Request, file: Express.Multer.File, cb: (error?: any, info?: Partial<Express.Multer.File>) => void): void {
    const bucket = 'test';
    const fileExtName = extname(file.originalname);
    const fileName = `${randomUUID()}${fileExtName.toLowerCase()}`;

    const buffer: Buffer[] = [];

    file.stream.on('data', (chunk) => {
      buffer.push(chunk);
    });

    file.stream.on('end', async () => {
      const fileBuffer = Buffer.concat(buffer);

      try {
        const bucketExists = await this.minioService.client.bucketExists(bucket);
        if (!bucketExists) {
          await this.minioService.client.makeBucket(bucket, 'us-east-1');
        }

        const duration = await getVideoDurationInSeconds(Readable.from(fileBuffer))

        const metaData = {
          'Content-Type': file.mimetype,
          duration,          
        };

        await this.minioService.client.putObject(bucket, fileName, fileBuffer, Buffer.byteLength(fileBuffer), metaData);

        cb(null, { filename: fileName, size: duration });
      } catch (error) {
        cb(error);
      }
    });

    file.stream.on('error', (err) => cb(err));
  }

  _removeFile(req: Request, file: Express.Multer.File, cb: (error: Error | null) => void): void {
    cb(null);
  }
}

export const MinioModuleConfig = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    const { accessKeyId: accessKey, domain, secretAccessKey: secretKey } = configService.get<StorageConfigs>('storage');

    return {
      endPoint: domain,
      accessKey,
      secretKey,
      useSSL: false,
      port: 9000,
    }
  },
  inject: [ConfigService],
};