import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as multerS3 from 'multer-s3';
import * as ffmpeg from 'fluent-ffmpeg';
import { extname } from 'path';
import { TaskService } from '@resources/tasks/task.service';

@Controller('upload')
export class FileController {
  private s3: S3Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly taskService: TaskService, // Инжектируем TaskService
  ) {
    this.s3 = new S3Client({
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
      region: this.configService.get<string>('AWS_S3_REGION'),
    });
  }

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerS3({
        s3: new S3Client(),
        bucket: process.env.AWS_S3_BUCKET_NAME,
        acl: 'public-read',
        key: (req, file, cb) => {
          const fileExtName = extname(file.originalname);
          const randomName = Date.now().toString();
          cb(null, `${randomName}${fileExtName}`);
        },
      }),
      limits: { fileSize: 1024 * 1024 * 1024 }, // Ограничение на размер файла 1Гб
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
    }),
  )
  async uploadFile(@UploadedFile() file: Express.MulterS3.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileUrl = file.location;

    const duration = await this.getFileDuration(fileUrl);

    const task = {
      inputFileId: file.key,
      status: 'created',
      duration,
      userId: 'test', // TODO add userId from request
    } as any;

    await this.taskService.createTask(task);

    return {
      message: 'File uploaded successfully',
      duration,
    };
  }

  private async getFileDuration(fileUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg(fileUrl).ffprobe((err, metadata) => {
        if (err) {
          return reject(new BadRequestException('Unable to process file'));
        }
        resolve(metadata.format.duration);
      });
    });
  }
}
