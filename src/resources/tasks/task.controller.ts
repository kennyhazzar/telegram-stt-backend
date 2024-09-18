import { Controller, Post, Get, Param, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard, ThrottlerBehindProxyGuard } from '../auth/guards';
import { UserRequestContext } from '@core/types';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UseGuards(ThrottlerBehindProxyGuard, AuthGuard)
  async createTask(
    @Req() request: UserRequestContext,
    @Body() { downloadId }: { downloadId: string },
  ) {
    return this.taskService.createTask(request.user.id, downloadId);
  }

  @Get(':taskId')
  @UseGuards(ThrottlerBehindProxyGuard, AuthGuard)
  async getTaskById(@Param('taskId') taskId: string) {
    const task = await this.taskService.getTask({ taskId });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
  }

  @Get('user/:userId')
  @UseGuards(ThrottlerBehindProxyGuard, AuthGuard)
  async getTasksByUserId(@Param('userId') userId: string) {
    return this.taskService.getTasksByUserId(userId);
  }
}
