import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { DownloadService } from './download.service';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Post('file')
  async downloadFile(@Body('url') url: string): Promise<void> {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    try {
      if (url.includes('drive.google.com')) {
        const fileId = this.extractGoogleDriveFileId(url);
        await this.downloadService.downloadFromGoogleDrive(fileId);
      } else if (url.includes('yadi.sk') || url.includes('disk.yandex.ru')) {
        await this.downloadService.downloadFromYandexDisk(url);
      } else {
        throw new BadRequestException('Unsupported URL');
      }
    } catch (error) {
      throw new BadRequestException('Failed to process the file');
    }
  }

  private extractGoogleDriveFileId(url: string): string {
    const match = url.match(/\/d\/(.*?)(\/|$)/);
    if (!match || !match[1]) {
      throw new BadRequestException('Invalid Google Drive URL');
    }
    return match[1];
  }
}
