import { Injectable } from '@nestjs/common';
import * as NodeID3 from 'node-id3';

@Injectable()
export class MediaService {
  // Функция для чтения WAV файлов
  private getWavDuration(buffer: Buffer): number {
    const chunkSize = buffer.readUInt32LE(4); // Размер файла
    const subChunk2Size = buffer.readUInt32LE(40); // Размер аудио данных
    const sampleRate = buffer.readUInt32LE(24); // Частота дискретизации
    const bitsPerSample = buffer.readUInt16LE(34); // Бит на семпл
    const numChannels = buffer.readUInt16LE(22); // Количество каналов

    // Длительность в секундах
    const durationInSeconds =
      subChunk2Size / ((sampleRate * numChannels * bitsPerSample) / 8);
    return durationInSeconds;
  }

  // Функция для чтения MP4 файлов
  private readUInt32BE(buffer: Buffer, offset: number): number {
    return buffer.readUInt32BE(offset);
  }

  private findAtom(buffer: Buffer, atomName: string) {
    let offset = 0;
    while (offset < buffer.length) {
      const size = this.readUInt32BE(buffer, offset);
      const name = buffer.toString('utf8', offset + 4, offset + 8);

      if (name === atomName) {
        return {
          size,
          offset,
        };
      }

      offset += size;
    }
    return null;
  }

  private async getMp4Duration(buffer: Buffer): Promise<number> {
    const moov = this.findAtom(buffer, 'moov');
    if (!moov) throw new Error('moov atom not found');

    const mvhd = this.findAtom(
      buffer.slice(moov.offset, moov.offset + moov.size),
      'mvhd',
    );
    if (!mvhd) throw new Error('mvhd atom not found');

    const mvhdData = buffer.slice(mvhd.offset, mvhd.offset + mvhd.size);
    const timeScale = this.readUInt32BE(mvhdData, 20); // Scale
    const duration = this.readUInt32BE(mvhdData, 24); // Duration

    return duration / timeScale; // Продолжительность в секундах
  }

  // Функция для чтения MP3 файлов с использованием ID3 тегов
  private async getMp3Duration(buffer: Buffer): Promise<number> {
    const tags = NodeID3.read(buffer);
    if (tags && tags.length) {
      return +tags.length / 1000;
    } else {
      throw new Error('Unable to extract MP3 duration');
    }
  }

  // Функция для чтения AVI файлов
  private getAviDuration(buffer: Buffer): number {
    const microSecPerFrame = buffer.readUInt32LE(32); // Длительность кадра в микросекундах
    const totalFrames = buffer.readUInt32LE(48); // Общее количество кадров

    const durationInSeconds = (microSecPerFrame * totalFrames) / 1000000; // Перевод в секунды
    return durationInSeconds;
  }

  // Главная функция для вызова правильного метода на основе MIME type
  async getMediaDuration(mimetype: string, buffer: Buffer): Promise<number> {
    switch (mimetype) {
      case 'audio/mpeg':
      case 'audio/mp3':
        return await this.getMp3Duration(buffer);
      case 'video/mp4':
        return await this.getMp4Duration(buffer);
      case 'audio/wav':
      case 'audio/x-wav':
        return this.getWavDuration(buffer);
      case 'video/x-msvideo': // MIME тип для AVI
        return this.getAviDuration(buffer);
      default:
        throw new Error(`Unsupported mimetype: ${mimetype}`);
    }
  }
}
