import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DownloadService {
  constructor(
    private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {}

  async uploadToS3(filePath: string, fileName: string): Promise<string> {
    const fileContent = fs.readFileSync(filePath);
    const bucketName = this.configService.get<string>('AWS_BUCKET_NAME');

    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileContent,
    };

    try {
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      return `https://${bucketName}.s3.amazonaws.com/${fileName}`; //TODO вот эта хуйня не нужна нам
    } catch (error) {
      throw new BadRequestException('Failed to upload file to S3');
    } finally {
      fs.unlinkSync(filePath); // Удаляем локальный файл после загрузки
    }
  }

  async downloadFromGoogleDrive(fileId: string): Promise<string> {
    try {
      const fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const filePath = path.join(__dirname, 'temp', `${fileId}.file`);

      const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream',
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      return this.uploadToS3(filePath, `${fileId}.file`);
    } catch (error) {
      throw new BadRequestException('Failed to download file from Google Drive');
    }
  }

  async downloadFromYandexDisk(publicUrl: string): Promise<string> {
    try {
      const getDownloadLinkUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}`;

      const linkResponse = await axios.get(getDownloadLinkUrl);
      const downloadLink = linkResponse.data.href;

      if (!downloadLink) {
        throw new BadRequestException('Failed to get download link from Yandex Disk');
      }

      const filePath = path.join(__dirname, 'temp', `${Date.now()}.file`);
      const response = await axios({
        url: downloadLink,
        method: 'GET',
        responseType: 'stream',
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      return this.uploadToS3(filePath, `${Date.now()}.file`);
    } catch (error) {
      throw new BadRequestException('Failed to download file from Yandex Disk');
    }
  }
}
