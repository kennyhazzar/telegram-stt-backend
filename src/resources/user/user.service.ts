import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Balance } from '@resources/balance/entities/balance.entity';
import { EntityService } from '@core/services';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly entityService: EntityService,
  ) {}

  async getUserByTelegramId(telegramId: number) {
    const user = await this.entityService.findOne({
      repository: this.userRepository,
      cacheValue: `telegram_${telegramId}`,
      queryBuilderAlias: 'user',
      queryBuilder: (qb) =>
        qb.where('user.telegramId = :telegramId', { telegramId })
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserWithBalance(userId: string): Promise<any> {
    const user = await this.entityService.findOne({
      repository: this.userRepository,
      cacheValue: `with_balance_${userId}`,
      queryBuilderAlias: 'user',
      queryBuilder: (qb) =>
        qb
          .leftJoinAndSelect('user.balance', 'balance')
          .where('user.id = :userId', { userId })
          .addSelect((subQuery) => {
            return subQuery
              .select('SUM(balance.amount)', 'totalAmount')
              .from(Balance, 'balance')
              .where('balance.userId = user.id');
          }, 'totalAmount'),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(createUserDto: {
    telegramId: number;
    username: string;
    firstName: string;
    secondName?: string;
  }): Promise<User> {
    return this.entityService.save<User>({
      repository: this.userRepository,
      payload: createUserDto,
      cacheValue: (user) => user.id,
    });
  }

  async updateUser(
    userId: string,
    updateUserDto: Partial<User>,
  ): Promise<User> {
    const user = await this.userRepository.preload({
      id: userId,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.entityService.update({
      payload: user,
      repository: this.userRepository,
      cacheValue: (user) => user.id,
    });
  }

  async deleteUser(userId: string): Promise<void> {
    const result = await this.userRepository.delete({ id: userId });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }
}
