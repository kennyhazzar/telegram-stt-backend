export class JobDownload {
  downloadId: string;
  fileId?: string;
  url?: string;
  buffer?: Buffer;
  filename?: string;
  mimetype?: string;
  title?: string;
  userId?: string;
}

export enum MessageDownloadEnum {
  DOWNLOAD_ADDED_TO_QUEUE = 'Загрузка успешно добавлена ​​в очередь',
}
