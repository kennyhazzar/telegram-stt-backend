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

  validateTelegramData(initData: string) {
    const urlSearchParams = new URLSearchParams(initData);
    const data: any = Object.fromEntries(urlSearchParams.entries());

    const checkString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest();

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    const isValid = signature === data.hash;

    if (isValid) {
      return {
        isValid,
        user: {
          telegramId: data.user.id,
          username: data.user.username,
          firstName: data.user.first_name,
          secondName: data.user.last_name,
        }
      };
    } else {
      return { isValid };
    }
  }

  async loginBySecret(telegramData: string) {
    const validateInitData = this.validateTelegramData(telegramData);

    if (validateInitData.isValid) {
      const { user: telegramUser } = validateInitData;

      let user = await this.usersService.getUserByTelegramId(
        telegramUser.telegramId,
      );

      if (!user) {
        try {
          user = await this.usersService.createUser({
            telegramId: telegramUser.telegramId,
            username: telegramUser?.username,
            firstName: telegramUser?.firstName,
            secondName: telegramUser?.secondName,
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
