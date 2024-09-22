import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotConfigs, PaymentConfigs, WebhookEvent } from '@core/types';
import { HttpService } from '@nestjs/axios';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { EntityService } from '../../core/services';
import { BalanceService } from '../balance/balance.service';
import { UserService } from '../user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentStatusType,
  PaymentType,
} from './entities';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { User } from '../user';
import { Update } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class PaymentsService {
  private logger = new Logger(PaymentsService.name);
  private accountId: number;
  private secretKey: string;
  private apiUrl: string;
  private botUrl: string;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentStatus)
    private readonly paymentStatusRepository: Repository<PaymentStatus>,
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly entityService: EntityService,
    private readonly balanceService: BalanceService,
    private readonly usersService: UserService,
  ) {
    this.initCredentials();
  }

  async createTransaction(userId: string, value: number) {
    const idempotenceKey = randomUUID();

    const { id: paymentId, user } = await this.createPaymentEntity(
      userId,
      value,
    );

    const confirmationRedirect = `${this.botUrl}?start=payment_${paymentId}`;
    const description = `Платеж ${paymentId} на сумму ${value} рублей`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/payments`,
          {
            amount: {
              value,
              currency: 'RUB',
            },
            capture: true,
            confirmation: {
              type: 'redirect',
              return_url: confirmationRedirect,
            },
            description,
            metadata: {
              paymentId,
              userId,
              idempotenceKey,
            },
          },
          {
            headers: {
              'Idempotence-Key': idempotenceKey,
            },
            auth: {
              username: String(this.accountId),
              password: this.secretKey,
            },
          },
        ),
      );

      try {
        await this.updatePayment(paymentId, {
          description: data.description,
          confirmationRedirect: data.confirmation,
        });
      } catch (error) {
        this.logger.error(error);
      }

      return {
        paymentId,
        amount: value,
        description: data.description,
        confirmation: data.confirmation,
      };
    } catch (error) {
      this.logger.log(error);

      await this.updatePaymentStatus(
        paymentId,
        PaymentStatusType.CANCELED,
        user.id,
        user.telegramId,
      );

      throw new InternalServerErrorException();
    }
  }

  async createPaymentEntity(userId: string, amount: number, type = PaymentType.DEPOSIT) {
    const user = await this.usersService.getUser({
      userId,
      withBalance: true,
    });

    if (!user) {
      throw new BadRequestException('user not found');
    }

    const payment = await this.entityService.save({
      repository: this.paymentRepository,
      payload: {
        amount,
        balance: {
          id: user.balance.id,
        },
        type,
      },
      bypassCache: true,
    });

    await this.entityService.save({
      repository: this.paymentStatusRepository,
      payload: {
        payment,
        status: PaymentStatusType.PENDING,
      },
      bypassCache: true,
    });

    return {
      id: payment.id,
      user,
    };
  }

  async updatePayment(
    paymentId: string,
    {
      description,
      confirmationRedirect,
    }: { description: string; confirmationRedirect: string },
  ) {
    const payload = await this.paymentRepository.preload({
      id: paymentId,
      ...{
        description,
        confirmationRedirect,
      },
    });

    return this.entityService.update({
      repository: this.paymentRepository,
      payload,
      bypassCache: true,
    });
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatusType,
    userId: string,
    telegramId: number,
  ) {
    try {
      await this.entityService.save({
        repository: this.paymentStatusRepository,
        payload: {
          payment: {
            id: paymentId,
          },
          status,
        },
        affectCache: async (cm) => {
          await cm.del(`user_${userId}`);
          await cm.del(`user_${telegramId}`);
        },
        bypassCache: true,
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async getPaymentById(paymentId: string) {
    return this.entityService.findOne({
      repository: this.paymentRepository,
      queryBuilderAlias: 'payment',
      queryBuilder: (qb) =>
        qb
          .leftJoinAndSelect('payment.statuses', 'statuses')
          .where('payment.id = :paymentId', { paymentId }),
      bypassCache: true,
    });
  }

  async prepairWebhook(payload: Record<string, any>) {
    this.logger.log({ 'webhook.payload': payload });

    if (!payload?.event) return;

    const webhookEvent = payload?.event as WebhookEvent;

    const paymentId = payload?.object?.metadata?.paymentId;
    const userId = payload?.object?.metadata?.userId;

    if (!paymentId || !userId) {
      this.logger.warn('Missing paymentId or userId');
      return;
    }

    const payment = await this.getPaymentById(paymentId);
    if (!payment) {
      this.logger.warn('Payment not found');
      return;
    }

    const user = await this.usersService.getUser({
      userId,
      withBalance: true,
    });
    if (!user) {
      this.logger.warn('User not found');
      return;
    }

    switch (webhookEvent) {
      case WebhookEvent.PaymentSucceeded:
        await this.handlePayment(user, payment, {
          success: true,
          telegramCallback: async (bot) => {
            await bot.telegram.sendMessage(
              user.telegramId,
              `Поступили средства в размере ${payment.amount} рублей! \n\n(paymentId: ${payment.id})`,
            );
          },
        });
        break;

      case WebhookEvent.PaymentCanceled:
        await this.handlePayment(user, payment, {
          telegramCallback: async (bot) => {
            await bot.telegram.sendMessage(
              user.telegramId,
              `Платеж "${payment.description || ''}" был отклонен`,
            );
          },
        });
        break;

      default:
        this.logger.warn(`Unhandled event: ${webhookEvent}`);
    }
  }

  private async handlePayment(
    user: User,
    payment: Payment,
    options?: {
      success?: boolean;
      telegramCallback?: (bot: Telegraf<Context<Update>>) => Promise<void>;
    },
  ) {
    const { success, telegramCallback } = options;

    if (success) {
      await this.balanceService.updateUserBalance(
        user.id,
        +user.balance.amount + +payment.amount,
      );

      await this.updatePaymentStatus(
        payment.id,
        PaymentStatusType.ADDED,
        user.id,
        user.telegramId,
      );
    }

    if (telegramCallback) {
      try {
        await telegramCallback(this.bot);
      } catch (error) {
        this.logger.error('Error sending message to user', error);
      }
    }
  }

  initCredentials() {
    const { accountId, secretKey, apiUrl } =
      this.configService.get<PaymentConfigs>('payment');

    const { botUrl } = this.configService.get<BotConfigs>('bot');

    this.accountId = accountId;
    this.secretKey = secretKey;
    this.apiUrl = apiUrl;
    this.botUrl = botUrl;
  }
}
