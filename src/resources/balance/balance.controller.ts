import { Controller, Get, Param } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { Balance } from './entities/balance.entity';

@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('user/:userId')
  async getTransactionsByUserId(
    @Param('userId') userId: string,
  ): Promise<Balance[]> {
    return this.balanceService.getTransactionsByUserId(userId);
  }
}
