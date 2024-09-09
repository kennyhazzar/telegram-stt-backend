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
} from '@nestjs/common';
import { DownloadService } from './download.service';
import { AuthGuard, ThrottlerBehindProxyGuard } from '@resources/auth/guards';
import { UserRequestContext } from '@core/types';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Post('file')
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
}
