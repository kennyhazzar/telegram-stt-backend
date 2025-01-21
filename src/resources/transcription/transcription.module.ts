import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { TranscriptionProcessor } from './transcription.processor';
import { Task } from '@resources/tasks/entities/task.entity';
import { TaskScheduler } from './task.scheduler';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.registerQueue({
      name: 'transcription',
    }),
    TypeOrmModule.forFeature([Task]),
    HttpModule,
  ],
  providers: [TaskScheduler, TranscriptionProcessor],
})
export class TranscriptionModule {}
