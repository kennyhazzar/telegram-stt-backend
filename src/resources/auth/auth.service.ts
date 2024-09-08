import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BotConfigs, CommonConfigs } from '@core/types';
import { UserService } from '../user/user.service';
import { TelegramDataDto } from './dto';

@Injectable()
export class AuthService {
  private env: string;

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.env = this.nodeEnv;
  }

  validateTelegramData(telegramData: TelegramDataDto): boolean {
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

  async loginBySecret(telegramData: TelegramDataDto) {
    if (this.validateTelegramData(telegramData) || this.env === 'development') {
      let user = await this.usersService.getUserByTelegramId(
        telegramData.telegramId,
      );

      if (!user) {
        try {
          user = await this.usersService.createUser({
            telegramId: telegramData.telegramId,
            username: telegramData?.username,
            firstName: telegramData?.firstName,
            secondName: telegramData?.secondName,
          });
        } catch (error) {
          console.log(error);

          throw new BadRequestException({
            message: 'error create user',
          });
        }
      }

      const payload = {
        id: user.id,
        telegramId: user.telegramId,
      };

      return {
        access_token: this.jwtService.sign(payload),
      };
    } else {
      throw new NotFoundException('Invalid creds');
    }
  }

  get botToken() {
    return this.configService.get<BotConfigs>('bot').token;
  }

  get nodeEnv() {
    return this.configService.get<CommonConfigs>('common').env;
  }
}
