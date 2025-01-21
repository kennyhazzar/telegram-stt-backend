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
  DOWNLOAD_EXPIRED = 'Файл удален по истечению срока хранения',
  DOWNLOAD_ERROR_UPLOAD_YOUTUBE = 'Error downloading and uploading audio from YouTube',
  DOWNLOAD_PROCESSING = 'Загрузка файла...',
  DOWNLOAD_DONE = 'Файл загружен!',
  DOWNLOAD_ERROR_UPLOAD_MINIO = 'Ошибка загрузки исходного файла в хранилище',
  DOWNLOAD_ERROR_UPLOAD_GOOGLE_DRIVE = 'Ошибка загрузки файла по ссылке из Google Drive',
}
