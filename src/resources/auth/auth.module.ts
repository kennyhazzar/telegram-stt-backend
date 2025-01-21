import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { JwtConfig } from '@core/configs';

@Module({
  imports: [UserModule, JwtModule.registerAsync(JwtConfig)],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
