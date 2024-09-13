import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserSourceEnum } from './entities/user.entity';
import { Balance } from '@resources/balance/entities/balance.entity';
import { EntityService } from '@core/services';
import { UserJwtPayload } from '@core/types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly entityService: EntityService,
  ) {}

  async getUser({
    telegramId,
    userId,
    errorHttp,
    withBalance,
  }: {
    telegramId?: number;
    userId?: string;
    errorHttp?: boolean;
    withBalance?: boolean;
  }) {
    if (!telegramId && !userId) {
      throw Error('need telegramId or userId');
    }

    const user = await this.entityService.findOne({
      repository: this.userRepository,
      cacheValue: `user_${telegramId && userId}`,
      queryBuilderAlias: 'user',
      queryBuilder: (qb) => {
        if (withBalance) {
          qb.addSelect((subQuery) => {
            return subQuery
              .select('SUM(balance.amount)', 'totalAmount')
              .from(Balance, 'balance')
              .where('balance.userId = user.id');
          }, 'totalAmount');
        }

        if (telegramId) {
          return qb.andWhere('user.telegramId = :telegramId', { telegramId });
        }

        if (userId) {
          return qb
            .leftJoinAndSelect('user.balance', 'balance')
            .andWhere('user.id = :userId', { userId });
        }
      },
    });

    if (!user && errorHttp) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(createUserDto: {
    telegramId: number;
    username: string;
    firstName: string;
    secondName?: string;
    languageCode?: string;
    md5?: string;
    source?: UserSourceEnum;
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

    const updateResult = await this.entityService.update({
      payload: user,
      repository: this.userRepository,
      cacheValue: (user) => user.id,
      affectCache: async (cacheManager) => {
        await Promise.allSettled([
          cacheManager.del(`user_${user.id}`),
          cacheManager.del(`user_${user.telegramId}`),
        ]);
      },
    });
    return updateResult;
  }

  async deleteUser(user: UserJwtPayload): Promise<void> {
    const result = await this.entityService.softDeleteOne({
      id: user.id,
      repository: this.userRepository,
      affectCache: async (cacheManager) => {
        await Promise.allSettled([
          cacheManager.del(`user_${user.id}`),
          cacheManager.del(`user_${user.telegramId}`),
        ]);
      },
    });

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }
}
