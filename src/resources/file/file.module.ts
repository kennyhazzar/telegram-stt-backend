import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
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
  controllers: [FileController],
  providers: [TaskService],
})
export class FileModule {}
