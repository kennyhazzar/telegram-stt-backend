import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
  Param,
  Get,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TaskService } from '@resources/tasks/task.service';
import { MinioService } from 'nestjs-minio-client';
import { Response } from 'express';
import { MinioFileInterceptor } from './file.interceptor';
import { ConfigService } from '@nestjs/config';
import { StorageConfigs } from '@core/types';

@Controller('upload')
export class FileController {
  private logger = new Logger(FileController.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly taskService: TaskService, // Инжектируем TaskService
    private readonly minioService: MinioService,
  ) {}

  @Get('/file/:filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const { bucketName } = this.configService.get<StorageConfigs>('storage');

    try {
      const fileStream = await this.minioService.client.getObject(
        bucketName,
        filename,
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      fileStream.pipe(res);
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).json({
        message: `File ${filename} not found`,
      });
    }
  }

  @Post('file')
  @UseInterceptors(MinioFileInterceptor)
  async uploadFile(@UploadedFile() file: Express.MulterS3.File) {
    try {
      if (!file) {
        throw new BadRequestException('File is required');
      }

      const task = {
        inputFileId: file.key,
        status: 'created',
        duration: file.size,
        userId: 'test', // TODO add userId from request
      } as any;

      // await this.taskService.createTask(task);

      return {
        filename: file.filename,
        message: 'File uploaded successfully',
        duration: file.size,
      };
    } catch (error) {
      this.logger.error(error);

      throw new BadRequestException();
    }
  }
}
