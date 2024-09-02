import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BotConfigs } from '@core/types';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  validateTelegramData(telegramData: any): boolean {
    const { hash, ...dataToCheck } = telegramData;

    const checkString = Object.keys(dataToCheck)
      .sort()
      .map((key) => `${key}=${dataToCheck[key]}`)
      .join('\n');

    const secretKey = crypto
      .createHash('sha256')
      .update(this.botToken)
      .digest();

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    return signature === hash;
  }

  async loginBySecret(telegramData: any) {
    if (this.validateTelegramData(telegramData)) {
      const user = await this.usersService.getUserByTelegramId(telegramData.telegramId)

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        access_token: this.jwtService.sign(user),
      };
    } else {
      throw new NotFoundException('Invalid creds');
    }
  }

  get botToken() {
    return this.configService.get<BotConfigs>('bot').token;
  }
}
