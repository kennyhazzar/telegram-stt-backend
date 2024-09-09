export class JobDownload {
  downloadId: string;
  fileId?: string;
  url?: string;
  buffer?: Buffer;
  filename?: string;
  mimetype?: string;
  title?: string;
}
