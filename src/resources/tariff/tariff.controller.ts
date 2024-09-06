import { Controller, Get, UseGuards } from '@nestjs/common';
import { TariffService } from './tariff.service';
import { ThrottlerBehindProxyGuard } from '../auth/guards';

@Controller('tariff')
export class TariffController {
  constructor(private readonly tariffService: TariffService) {}

  @Get()
  @UseGuards(ThrottlerBehindProxyGuard)
  async getCurrentTariff() {
    const tariff = await this.tariffService.getTariff();

    return tariff.pricePerMinute;
  }
}
