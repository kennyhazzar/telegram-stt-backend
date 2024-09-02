import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Balance } from '@resources/balance/entities/balance.entity';
import { EntityService } from '@core/services';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfig } from '@core/configs';
import { RedisClientOptions } from 'redis';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Balance]),
    CacheModule.registerAsync<RedisClientOptions>(CacheConfig),
  ],
  providers: [UserService, EntityService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
