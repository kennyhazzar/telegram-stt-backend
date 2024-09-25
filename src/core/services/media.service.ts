import { Injectable } from '@nestjs/common';
import * as NodeID3 from 'node-id3';

@Injectable()
export class MediaService {
  private getWavDuration(buffer: Buffer): number {
    const chunkSize = buffer.readUInt32LE(4);
    const subChunk2Size = buffer.readUInt32LE(40);
    const sampleRate = buffer.readUInt32LE(24);
    const bitsPerSample = buffer.readUInt16LE(34);
    const numChannels = buffer.readUInt16LE(22);

    const durationInSeconds =
      subChunk2Size / ((sampleRate * numChannels * bitsPerSample) / 8);
    return durationInSeconds;
  }

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
    const timeScale = this.readUInt32BE(mvhdData, 20);
    const duration = this.readUInt32BE(mvhdData, 24);

    return duration / timeScale;
  }

  private async getMp3Duration(buffer: Buffer): Promise<number> {
    const tags = NodeID3.read(buffer);
    if (tags && tags.length) {
      return +tags.length / 1000;
    } else {
      throw new Error('Unable to extract MP3 duration');
    }
  }

  private getAviDuration(buffer: Buffer): number {
    const microSecPerFrame = buffer.readUInt32LE(32);
    const totalFrames = buffer.readUInt32LE(48);

    const durationInSeconds = (microSecPerFrame * totalFrames) / 1000000;
    return durationInSeconds;
  }

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
      case 'video/x-msvideo':
        return this.getAviDuration(buffer);
      default:
        throw new Error(`Unsupported mimetype: ${mimetype}`);
    }
  }
}
