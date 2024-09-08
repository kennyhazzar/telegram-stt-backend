import { User } from '@resources/user';
import { DownloadSourceEnum, DownloadStatusEnum } from '../entities';

export class CreateDownloadDto {
  source: DownloadSourceEnum;
  url: string;
  userId?: string;
}

export class UpdateDownloadDto {
  status?: DownloadStatusEnum;
  source?: DownloadSourceEnum;
  filename: string;
  user?: User;
  error?: string;
  url?: string;
  duration?: number;
  title?: string;
}
