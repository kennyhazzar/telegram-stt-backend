import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async createPayment(
    @Body() { amount, userId }: { amount: number; userId: string },
  ) {
    return this.paymentsService.createTransaction(userId, amount);
  }

  @Post('webhooks')
  @HttpCode(HttpStatus.OK)
  async prepairWebhook(@Body() payload: Record<string, any>) {
    return this.paymentsService.prepairWebhook(payload);
  }
}
