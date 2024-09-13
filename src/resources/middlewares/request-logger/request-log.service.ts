import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestLog } from './entities';

@Injectable()
export class RequestLogService {
  constructor(
    @InjectRepository(RequestLog)
    private requestLogRepository: Repository<RequestLog>,
  ) {}

  async createPreliminaryLog(logData: Partial<RequestLog>): Promise<RequestLog> {
    const log = this.requestLogRepository.create(logData);
    return this.requestLogRepository.save(log);
  }

  async updateLog(id: string, updatedData: Partial<RequestLog>) {
    await this.requestLogRepository.update(id, updatedData);
  }
}
