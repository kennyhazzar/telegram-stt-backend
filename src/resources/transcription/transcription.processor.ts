import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { Task } from '@resources/tasks/entities/task.entity';

@Processor('transcription')
export class TranscriptionProcessor {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  @Process()
  async handleTranscription(job: Job): Promise<void> {
    try {
      const statusResponse = await lastValueFrom(
        this.httpService.get('http://transcription-service-url/status')
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
        this.httpService.post('http://transcription-service-url/transcribe', {
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
