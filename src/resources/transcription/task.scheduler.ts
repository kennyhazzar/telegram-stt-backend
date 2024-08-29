import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';

@Injectable()
export class TaskScheduler {
  constructor(
    @InjectQueue('transcription') private transcriptionQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    await this.transcriptionQueue.add({});
  }
}