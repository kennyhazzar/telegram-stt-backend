import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tariff } from './entities';
import { ConfigService } from '@nestjs/config';
import { CommonConfigs } from '@core/types';

@Injectable()
export class TariffService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Tariff)
    private readonly tariffRepository: Repository<Tariff>,
  ) {}

  async getTariff(): Promise<Tariff> {
    let tariff = await this.tariffRepository.findOne({
      where: {
        isActive: true,
      },
    });

    if (!tariff) {
      tariff = this.tariffRepository.create({
        pricePerMinute: this.pricePerMinute,
      });
      await this.tariffRepository.save(tariff);
    }

    return tariff;
  }

  async updateTariff(newPrice: number): Promise<Tariff> {
    const tariff = await this.getTariff();
    tariff.pricePerMinute = newPrice;
    return this.tariffRepository.save(tariff);
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
