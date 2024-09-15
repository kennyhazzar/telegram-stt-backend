import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Balance } from './entities/balance.entity';
import { EntityService } from '@core/services';
import { UserService } from '../user/user.service';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,
    private readonly usersService: UserService,
    private readonly entityService: EntityService,
  ) {}

  async getTransactionsByUserId(userId: string): Promise<Balance[]> {
    return this.entityService.findMany({
      repository: this.balanceRepository,
      where: { user: { id: userId } },
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
}
