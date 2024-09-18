import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Balance } from './entities/balance.entity';
import { EntityService } from '@core/services';
import { UserService } from '../user/user.service';
import { Payment } from '../payments/entities';
import { TariffService } from '../tariff/tariff.service';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly usersService: UserService,
    private readonly entityService: EntityService,
    private readonly tariffService: TariffService,
  ) {}

  async createBalance(userId: string) {
    return this.entityService.save({
      repository: this.balanceRepository,
      payload: {
        user: {
          id: userId,
        },
      },
      bypassCache: true,
    });
  }

  async getTransactionsByUserId(userId: string): Promise<Balance[]> {
    return this.entityService.findMany({
      repository: this.paymentsRepository,
      where: { balance: { user: { id: userId } } },
      order: { createdAt: 'DESC' },
      cacheValue: '',
      bypassCache: true,
    });
  }

  async updateUserBalance(userId: string, amount: number): Promise<Balance> {
    const user = await this.usersService.getUser({
      userId,
      withBalance: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const balance = await this.entityService.save({
      repository: this.balanceRepository,
      cacheValue: (balance) => balance.id,
      payload: {
        user,
        amount,
      },
    });

    return balance;
  }

  async calculateCost(duration: number, userId: string) {
    const { pricePerMinute } = await this.tariffService.getTariff();

    const totalCost = Math.ceil(duration / 60) * pricePerMinute;

    const user = await this.usersService.getUser({
      userId,
      withBalance: true,
    });

    if (totalCost > user.balance.amount) {
      const error = `Не хватает ${totalCost - user.balance.amount} рублей для оплаты. Стоимость - ${totalCost} рублей\nБаланс - ${user.balance.amount}`;

      return {
        isPassed: false,
        totalCost,
        error,
      };
    } else {
      return {
        isPassed: true,
        totalCost,
      };
    }
  }
}
