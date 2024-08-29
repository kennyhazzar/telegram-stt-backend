import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { Task } from '@resources/tasks/entities/task.entity';
import { ConfigService } from '@nestjs/config';

@Processor('transcription')
export class TranscriptionProcessor {
  private transcriptionServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly configService: ConfigService,
  ) {
    this.transcriptionServiceUrl = this.configService.get<string>('TRANSCRIPTION_SERVICE_URL');
  }

  @Process()
  async handleTranscription(job: Job): Promise<void> {
    try {
      const statusResponse = await lastValueFrom(
        this.httpService.get(`${this.transcriptionServiceUrl}/status`)
      );

      if (statusResponse.data.status !== 'idle') {
        return;
      }

      const task = await this.taskRepository.findOne({
        where: { status: 'created' },
        order: { createdAt: 'ASC' },
      });

      if (!task) {
        return; 
      }

      const transcriptionResponse = await lastValueFrom(
        this.httpService.post(`${this.transcriptionServiceUrl}/transcribe`, {
          fileId: task.inputFileId,
        })
      );

      task.status = 'processing';
      await this.taskRepository.save(task);
    } catch (error) {
      console.error('Error processing transcription:', error);
    }
  }
}
