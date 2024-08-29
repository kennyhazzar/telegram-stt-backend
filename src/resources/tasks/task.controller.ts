import { Controller, Post, Patch, Get, Param, Body } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from './entities/task.entity';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(@Body() createTaskDto: {
    status: 'created' | 'processing' | 'done' | 'rejected' | 'error';
    inputFileId: string;
    outputFileId?: string;
    duration?: number;
    userId: string;
  }) {
    return this.taskService.createTask(createTaskDto);
  }

  @Patch(':taskId')
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: Partial<Task>,
  ) {
    return this.taskService.updateTask(taskId, updateTaskDto);
  }

  @Get(':taskId')
  async getTaskById(@Param('taskId') taskId: string) {
    return this.taskService.getTaskById(taskId);
  }

  @Get('user/:userId')
  async getTasksByUserId(@Param('userId') userId: string) {
    return this.taskService.getTasksByUserId(userId);
  }
}
