import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { User } from '@resources/user/entities/user.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Создание новой задачи
  async createTask(createTaskDto: {
    status: 'created' | 'processing' | 'done' | 'rejected' | 'error';
    inputFileId: string;
    outputFileId?: string;
    duration?: number;
    userId: string; // Добавлен userId
  }): Promise<Task> {
    const user = await this.userRepository.findOne({
      where: { id: createTaskDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      user,
    });

    return this.taskRepository.save(task);
  }

  // Обновление задачи
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
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['tasks'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.tasks;
  }
}
