import { Command, Start, Update } from 'nestjs-telegraf';
import { MainUpdateContext } from '@core/types';
import { PaymentsService } from '@resources/payments/payments.service';
import { PaymentStatusType } from '@resources/payments/entities';

@Update()
export class StartUpdate {
  constructor(
    private readonly paymentService: PaymentsService,
  ) {}

  @Start()
  async start(ctx: MainUpdateContext) {
    const startPayload = (ctx as any)?.startPayload as string;

    if (startPayload) {
      const [, paymentId] = startPayload.split('_');

      const payment = await this.paymentService.getPaymentById(paymentId);

      const succeededStatus = payment.statuses.find(
        ({ status }) => status === PaymentStatusType.SUCCEEDED,
      );

      if (
        succeededStatus &&
        !payment.statuses.some(
          ({ status }) => status === PaymentStatusType.ADDED,
        )
      ) {
        await ctx.reply(
          `Ваш платеж принят! (${payment.amount} руб; ${payment.id}; ${payment.type})`,
        );
      }

      return;
    }

    try {
      await ctx.reply(
        `Привет, ${ctx.state.user.username || 'Koto'} (${ctx.state.user.id}).\n\nВаш баланс: ${ctx.state.user.balance.amount} рублей`,
      );
    } catch (error) {
      console.log(error);
    }
  }

  @Command('pay')
  async pay(ctx: MainUpdateContext) {
    const { state: { user: { id: userId } } } = ctx;

    try {
      const data = await this.paymentService.createTransaction(userId, (ctx as any)?.payload);

      await ctx.reply(JSON.stringify(data));
    } catch (error) {
      console.log(error);
    }
  }
}
