import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Balance } from '@resources/balance/entities/balance.entity';
import { EntityService } from '@core/services';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfig, JwtConfig } from '@core/configs';
import { RedisClientOptions } from 'redis';
import { AuthGuard } from '../auth/guards';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Balance]),
    CacheModule.registerAsync<RedisClientOptions>(CacheConfig),
    JwtModule.registerAsync(JwtConfig),
  ],
  providers: [UserService, EntityService, AuthGuard],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
