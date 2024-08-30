import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TaskService } from '@resources/tasks/task.service';
import { TaskModule } from '../tasks/task.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../user/entities/user.entity';
import { MinioModuleConfig } from '@core/configs';
import { MinioModule } from 'nestjs-minio-client';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([Task, User]),
    MinioModule.registerAsync(MinioModuleConfig),
    HttpModule,
    TaskModule,
  ],
  controllers: [FileController],
  providers: [TaskService],
})
export class FileModule {}
