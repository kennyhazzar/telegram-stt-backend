import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Balance } from '@resources/balance/entities/balance.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,
  ) {}

  async getUserWithBalance(userId: string): Promise<any> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.balance', 'balance')
      .where('user.id = :userId', { userId })
      .addSelect(subQuery => {
        return subQuery
          .select('SUM(balance.amount)', 'totalAmount')
          .from(Balance, 'balance')
          .where('balance.userId = user.id');
      }, 'totalAmount')
      .getOne();

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
    md5: string;
  }): Promise<User> {
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save(newUser);
  }

  async updateUser(userId: string, updateUserDto: Partial<User>): Promise<User> {
    const user = await this.userRepository.preload({
      id: userId,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepository.save(user);
  }

  async deleteUser(userId: string): Promise<void> {
    const result = await this.userRepository.delete({id: userId});

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }
}
