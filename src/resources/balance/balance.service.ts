import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Balance } from './entities/balance.entity';
import { User } from '@resources/user/entities/user.entity';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getTransactionsByUserId(userId: string): Promise<Balance[]> {
    return this.balanceRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async updateUserBalance(userId: string, amount: number): Promise<Balance> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const balance = this.balanceRepository.create({
      user,
      amount,
    });

    return this.balanceRepository.save(balance);
  }
}
