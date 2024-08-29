import { Module } from '@nestjs/common';
import { UploadController } from './file.controller';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TaskService } from '@resources/tasks/task.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
  ],
  controllers: [UploadController],
  providers: [TaskService],
})
export class UploadModule {}
