import { BadRequestException } from '@nestjs/common';
import { MinioStorage } from './minio-storage.config';
import { MinioService } from 'nestjs-minio-client';
import { ConfigService } from '@nestjs/config';

export const fileInterceptorConfig = (minioService: MinioService, configService: ConfigService) => ({
  storage: new MinioStorage(minioService, configService),
  limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'video/mp4',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'video/x-msvideo',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new BadRequestException('Invalid file format'), false);
    }
    cb(null, true);
  },
});
