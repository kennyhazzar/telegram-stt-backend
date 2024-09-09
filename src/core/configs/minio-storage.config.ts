import { Injectable } from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';
import { Request } from 'express';
import { StorageEngine } from 'multer';
import { extname } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageConfigs, UserRequestContext } from '../types';
import { Readable } from 'typeorm/platform/PlatformTools';
import getVideoDurationInSeconds from 'get-video-duration';
import { randomUUID } from 'crypto';
import { DownloadService } from '@resources/download/download.service';
import { DownloadSourceEnum } from '@resources/download/entities';

@Injectable()
export class MinioStorage implements StorageEngine {
  constructor(
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
    private readonly downloadService: DownloadService,
  ) {}

  _handleFile(
    req: UserRequestContext,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    const { bucketName: bucket } =
      this.configService.get<StorageConfigs>('storage');
    const fileExtName = extname(file.originalname);
    const fileName = `${randomUUID()}${fileExtName.toLowerCase()}`;

    const buffer: Buffer[] = [];

    file.stream.on('data', (chunk) => {
      buffer.push(chunk);
    });

    file.stream.on('end', async () => {
      const fileBuffer = Buffer.concat(buffer);

      try {

        const download = await this.downloadService.addUploadToQueue(req.user.id, {
          buffer: fileBuffer,
          mimetype: file.mimetype,
          title: file.originalname,
        })

        cb(null, { filename: fileName, destination: download.id });
      } catch (error) {
        cb(error);
      }
    });

    file.stream.on('error', (err) => cb(err));
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void,
  ): void {
    cb(null);
  }
}

export const MinioModuleConfig = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    const {
      accessKeyId: accessKey,
      domain,
      secretAccessKey: secretKey,
    } = configService.get<StorageConfigs>('storage');

    return {
      endPoint: domain,
      accessKey,
      secretKey,
      useSSL: false,
      port: 9000,
    };
  },
  inject: [ConfigService],
};
