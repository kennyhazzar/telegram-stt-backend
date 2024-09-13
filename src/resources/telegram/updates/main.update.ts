import { Update, Use } from 'nestjs-telegraf';
import {
  MainUpdateContext,
} from '@core/types';
import { UserService } from '@resources/user/user.service';
import { User, UserSourceEnum } from '../../user';
import * as generateMd5 from 'md5';


@Update()
export class MainUpdate {
  constructor(private readonly usersService: UserService) {}

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

    let user = await this.usersService.getUserByTelegramId(ctx.chat.id);

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
      await this.usersService.updateUser(user.id, {
        firstName,
        secondName,
        username,
        md5,
      });
    }

    if (user.isBlocked) {
      return;
    }

    return user;
  }
}
