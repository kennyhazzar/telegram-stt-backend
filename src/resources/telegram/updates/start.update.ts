import { Start, Update } from 'nestjs-telegraf';
import { MainUpdateContext } from '@core/types';

@Update()
export class StartUpdate {
  constructor() {}

  @Start()
  async start(ctx: MainUpdateContext) {
    try {
      await ctx.reply(`Привет, ${ctx.state.user.id}`);
    } catch (error) {
      console.log(error);
    }
  }
}
