import { Column, Entity } from "typeorm";
import { PrimaryUuidBaseEntity } from "@core/db";

@Entity('tariff')
export class Tariff extends PrimaryUuidBaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerMinute: number;
  
  @Column({ type: 'boolean', default: true, unique: true })
  isActive: boolean;
}
