import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotConfigs, PaymentConfigs } from '@core/types';
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

    const {id: paymentId, user } = await this.createPaymentEntity(userId, value);

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
              return_url: `${this.botUrl}?start=payment_${paymentId}`,
            },
            description: `Платеж ${paymentId} на сумму ${value} рублей`,
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

      if (data.status === 'pending') {
        await this.updatePaymentStatus(paymentId, PaymentStatusType.PENDING, user.id, user.telegramId);
      }

      return {
        paymentId,
        amount: value,
        description: data.description,
        confirmation: data.confirmation,
      };
    } catch (error) {
      this.logger.log(error);

      throw new InternalServerErrorException();
    }
  }

  async createPaymentEntity(userId: string, amount: number) {
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
        type: PaymentType.DEPOSIT,
      },
      bypassCache: true,
    });

    await this.entityService.save({
      repository: this.paymentStatusRepository,
      payload: {
        payment,
      },
      bypassCache: true,
    });

    return {
      id: payment.id,
      user,
    };
  }

  async updatePaymentStatus(paymentId: string, status: PaymentStatusType, userId: string, telegramId: number) {
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

    if (payload?.event) {
      const [event, type] = (payload?.event as string).split('.');

      if (event === 'payment') {
        const paymentId = payload?.object?.metadata?.paymentId;
        const userId = payload?.object?.metadata?.userId;

        const payment = await this.getPaymentById(paymentId);

        this.logger.log({ payment });

        if (type === 'succeeded') {
          const user = await this.usersService.getUser({
            userId,
            withBalance: true,
          });

          this.logger.log({ user });
          
          await this.balanceService.updateUserBalance(
            userId,
            user.balance.amount + payment.amount,
          );

          await this.updatePaymentStatus(paymentId, PaymentStatusType.ADDED, user.id, user.telegramId);

          try {
            await this.bot.telegram.sendMessage(
              user.telegramId,
              `Поступили средста в размере ${payment.amount} рублей!`,
            );
          } catch (error) {
            console.log(error);
          }
        }
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
