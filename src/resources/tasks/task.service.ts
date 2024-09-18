import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { EntityService } from '@core/services';
import { UserService } from '../user/user.service';
import { DownloadService } from '../download/download.service';
import { DownloadStatusEnum } from '../download/entities';
import { BalanceService } from '../balance/balance.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentType } from '../payments/entities';

@Injectable()
export class TaskService {
  private logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly entityService: EntityService,
    private readonly usersService: UserService,
    private readonly downloadsService: DownloadService,
    private readonly balanceService: BalanceService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createTask(userId: string, downloadId: string) {
    const user = await this.usersService.getUser({
      userId,
      withBalance: true,
    }); 

    const download = await this.downloadsService.getDownload({
      id: downloadId,
      userId,
      status: DownloadStatusEnum.DONE,
    });

    if (!download) {
      throw new NotFoundException('Данной загрузки не существует!');
    }

    const cost = await this.balanceService.calculateCost(download.duration, userId);

    if (!cost.isPassed) {
      throw new BadRequestException(cost?.error || 'Непредвиденная ошибка расчета стоимости обработки');
    }

    const [, newBalance] = await Promise.allSettled([
      this.paymentsService.createPaymentEntity(userId, cost.totalCost, PaymentType.WITHDRAWAL),
      this.balanceService.updateUserBalance(userId, +user.balance.amount - cost.totalCost),
    ]);

    let newBalanceAmount: number

    if (newBalance.status === 'fulfilled') {
      newBalanceAmount = newBalance.value.amount;
    }

    try {
      const task = await this.entityService.save({
        repository: this.taskRepository,
        payload: {
          download,
          user: {
            id: userId,
          },
          totalCost: cost.totalCost,
        },
        bypassCache: true,
      });

      return {
        taskId: task.id,
        newBalance: newBalanceAmount,
      };
    } catch (error) {
      this.logger.error(error);
      console.log(error);

      throw new InternalServerErrorException('Ошибка при создании задачи');
    }
  }

  async updateTask(
    taskId: string,
    updateTaskDto: Partial<Task>,
  ): Promise<Task> {
    const task = await this.taskRepository.preload({
      id: taskId,
      ...updateTaskDto,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.taskRepository.save(task);
  }

  async getTaskById(taskId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    return this.entityService.findMany({
      repository: this.taskRepository,
      where: {
        user: {
          id: userId,
        },
      },
      order: { createdAt: 'DESC' },
      cacheValue: '',
      bypassCache: true,
    });
  }
}
