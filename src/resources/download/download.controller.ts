import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  NotFoundException,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { DownloadService } from './download.service';
import { AuthGuard, ThrottlerBehindProxyGuard } from '@resources/auth/guards';
import { UserRequestContext } from '@core/types';
import { MinioFileInterceptor } from './download.interceptor';

@Controller('download')
export class DownloadController {
  private logger = new Logger(DownloadController.name);

  constructor(private readonly downloadService: DownloadService) {}

  @Post('file')
  @UseInterceptors(MinioFileInterceptor)
  @UseGuards(ThrottlerBehindProxyGuard, AuthGuard)
  async uploadFile(@UploadedFile() file: Express.MulterS3.File) {
    try {
      if (!file) {
        throw new BadRequestException('File is required');
      }

      return {
        downloadId: file.destination,
        message: 'Download was added to queue successfully',
      };
    } catch (error) {
      this.logger.error(error);

      throw new BadRequestException();
    }
  }

  @Post('url')
  @UseGuards(ThrottlerBehindProxyGuard, AuthGuard)
  async downloadFile(
    @Req() request: UserRequestContext,
    @Body('url') url: string,
  ) {
    return this.downloadService.addJobToQueue(url, request.user.id);
  }

  @Get('status/:id')
  @UseGuards(ThrottlerBehindProxyGuard, AuthGuard)
  async getDownloadStatus(
    @Req() request: UserRequestContext,
    @Param('id') id: string,
  ) {
    if (!id) {
      throw new BadRequestException('please provide uuid');
    }

    const download = await this.downloadService.getDownload({
      id,
      userId: request.user.id,
    });

    if (!download) {
      throw new NotFoundException();
    }

    return download;
  }

  @Get('status')
  @UseGuards(ThrottlerBehindProxyGuard, AuthGuard)
  async getDownloadStatuses(@Req() request: UserRequestContext) {
    return this.downloadService.getDownloadStatuses(request.user.id);
  }
}
