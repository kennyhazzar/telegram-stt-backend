import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { Balance } from './entities/balance.entity';
import { UserRequestContext } from '@core/types';
import { AuthGuard, ThrottlerBehindProxyGuard } from '../auth/guards';

@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('user')
  @UseGuards(ThrottlerBehindProxyGuard, AuthGuard)
  async getTransactionsByUserId(
    @Req() request: UserRequestContext,
  ): Promise<Balance[]> {
    return this.balanceService.getTransactionsByUserId(request.user.id);
  }
}
