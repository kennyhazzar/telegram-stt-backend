import { Entity, Column, ManyToOne } from 'typeorm';
import { PrimaryUuidBaseEntity } from '@core/db';
import { User } from '@resources/user/entities/user.entity';

@Entity('balance')
export class Balance extends PrimaryUuidBaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ManyToOne(() => User, (user) => user.balance)
  user: User;
}