import { Start, Update } from 'nestjs-telegraf';
import { MainUpdateContext } from '@core/types';

@Update()
export class StartUpdate {
  constructor() {}

  @Start()
  async start(ctx: MainUpdateContext) {
    try {
      await ctx.reply(`Привет, ${ctx.state.user.username || 'Koto'} (${ctx.state.user.id}).\n\nВаш баланс: ${ctx.state.user.balance.amount} рублей`);
    } catch (error) {
      console.log(error);
    }
  }
}
