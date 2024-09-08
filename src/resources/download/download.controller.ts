import { Controller, Post, Body, BadRequestException, Get, Query, NotFoundException } from '@nestjs/common';
import { DownloadService } from './download.service';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Post('file')
  async downloadFile(@Body('url') url: string) {
    return this.downloadService.addJobToQueue(url);
  }

  @Get('status/:id')
  async getDownloadStatus(@Query('id') id: string) {
    const download = await this.downloadService.getDownload(id);

    if (!download) {
      throw new NotFoundException();
    }

    return download;
  }
}
