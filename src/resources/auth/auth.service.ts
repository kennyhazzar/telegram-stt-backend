import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly botToken = process.env.BOT_TOKEN;

  constructor(private readonly jwtService: JwtService) {}

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

  async login(user: any) {
    const payload = { username: user.username, sub: user.user_id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
