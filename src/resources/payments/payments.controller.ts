import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { IpWhitelistGuard } from './payments.guard';
import { AuthGuard, ThrottlerBehindProxyGuard } from '../auth/guards';
import { UserRequestContext } from '@core/types';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('yoomoney')
  @UseGuards(ThrottlerBehindProxyGuard, AuthGuard)
  async createPayment(
    @Req() request: UserRequestContext,
    @Body() { amount }: { amount: number },
  ) {
    return this.paymentsService.createTransaction(request.user.id, amount);
  }

  @Post('webhooks')
  @UseGuards(ThrottlerBehindProxyGuard, IpWhitelistGuard)
  @HttpCode(HttpStatus.OK)
  async prepairWebhook(@Body() payload: Record<string, any>) {
    return this.paymentsService.prepairWebhook(payload);
  }
}
