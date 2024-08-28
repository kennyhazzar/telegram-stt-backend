import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceService } from './balance.service';
import { Balance } from './entities/balance.entity';
import { User } from '@resources/user/entities/user.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Balance, User])],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}
