import { Update, Use } from 'nestjs-telegraf';
import { CommonConfigs, MainUpdateContext } from '@core/types';
import { UserService } from '@resources/user/user.service';
import { User, UserSourceEnum } from '../../user';
import * as generateMd5 from 'md5';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Update()
export class MainUpdate {
  private logger = new Logger(`tg-${MainUpdate.name}`);

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Use()
  async checkUserMiddleware(ctx: MainUpdateContext, next: () => Promise<void>) {
    if (ctx.chat.type !== 'private') {
      return;
    }

    let user: User;

    if (ctx) {
      user = await this.checkUser(ctx);
      ctx.state.user = user;

      await next();

      return;
    }

    await next();
  }

  private async checkUser(ctx: MainUpdateContext): Promise<User | null> {
    const { first_name: firstName, last_name: secondName, username } = ctx.from;
    const md5 = generateMd5(
      JSON.stringify({ firstName, secondName, username }),
    );

    let user = await this.usersService.getUser({
      telegramId: ctx.chat.id,
      withBalance: true,
    });

    if (!user) {
      const languageCode = ctx.from.language_code === 'ru' ? 'ru' : 'en';

      user = await this.usersService.createUser({
        telegramId: ctx.chat.id,
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
        secondName: ctx.from?.last_name,
        languageCode,
        md5,
        source: UserSourceEnum.BOT,
      });
    }

    if (user.md5 !== md5) {
      await this.usersService.updateTelegramProfile(user, {
        firstName,
        secondName,
        username,
        md5,
      });
    }

    if (user.isBlocked) {
      return;
    }

    // try {
    //   const payload = {
    //     id: user.id,
    //     telegramId: user.telegramId,
    //   };

    //   if (
    //     this.configService.get<CommonConfigs>('common').env === 'development'
    //   ) {
    //     this.logger.log({
    //       testData: true,
    //       payload,
    //       tempAccessToken: this.jwtService.sign(payload),
    //     });
    //   }
    // } catch (error) {
    //   this.logger.error(error);
    // }

    return user;
  }
}
