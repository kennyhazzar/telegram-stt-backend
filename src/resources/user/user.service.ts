import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserSourceEnum } from './entities/user.entity';
import { Balance } from '@resources/balance/entities/balance.entity';
import { EntityService } from '@core/services';
import { UserJwtPayload } from '@core/types';
import { UpdateTelegramProfileDto } from './dto';
import { Cache } from 'cache-manager';
import { BalanceService } from '@resources/balance/balance.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Balance) private readonly balanceRepository: Repository<Balance>,
    private readonly entityService: EntityService,
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
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
      cacheValue: `${telegramId || userId}`,
      queryBuilderAlias: 'user',
      queryBuilder: (qb) => {
        if (withBalance) {
          qb.leftJoinAndSelect('user.balance', 'balance');
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

  async createUser(payload: {
    telegramId: number;
    username: string;
    firstName: string;
    secondName?: string;
    languageCode?: string;
    md5?: string;
    source?: UserSourceEnum;
  }): Promise<User> {
    const user = await this.entityService.save<User>({
      repository: this.userRepository,
      payload,
      cacheValue: (user) => user.id,
    });

    await this.entityService.save<Balance>({
      repository: this.balanceRepository,
      payload: {
        user,
      },
      bypassCache: true,
    })

    return user;
  }

  async updateTelegramProfile(
    user: User,
    newProfile: UpdateTelegramProfileDto,
  ) {
    const updatedUser = await this.userRepository.save({
      ...user,
      ...newProfile,
    });

    await Promise.allSettled([
      this.cacheManager.del(`user_${updatedUser.telegramId}`),
      this.cacheManager.del(`user_${updatedUser.id}`),
    ]);
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
