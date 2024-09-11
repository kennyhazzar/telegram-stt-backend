import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tariff } from './entities';
import { ConfigService } from '@nestjs/config';
import { CommonConfigs } from '@core/types';
import { EntityService } from '@core/services';

@Injectable()
export class TariffService {
  constructor(
    private readonly configService: ConfigService,
    private readonly entityService: EntityService,
    @InjectRepository(Tariff)
    private readonly tariffRepository: Repository<Tariff>,
  ) {}

  async getTariff(): Promise<Tariff> {
    let tariff = await this.entityService.findOne({
      repository: this.tariffRepository,
      cacheValue: 'main',
      ttl: 600,
      where: {
        isActive: true,
      },
    });

    if (!tariff) {
      tariff = await this.entityService.save({
        repository: this.tariffRepository,
        cacheValue: () => 'main',
        payload: {
          pricePerMinute: this.pricePerMinute,
        },
      });
    }

    return tariff;
  }

  async updateTariff(newPrice: number): Promise<Tariff> {
    const payload = await this.getTariff();
    payload.pricePerMinute = newPrice;
    return this.entityService.update({
      payload,
      repository: this.tariffRepository,
      cacheValue: () => 'main',
    });
  }

  get pricePerMinute() {
    const price =
      this.configService.get<CommonConfigs>('common')?.pricePerMinute;

    if (!price) {
      return 5;
    }

    return price;
  }
}
