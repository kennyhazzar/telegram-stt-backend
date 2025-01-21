import { Entity, Column, OneToMany, OneToOne, Index } from 'typeorm';
import { PrimaryUuidBaseEntity } from '@core/db';
import { User } from '@resources/user/entities/user.entity';
import { Payment } from '@resources/payments/entities';

@Entity('balance')
@Index(['amount'])
export class Balance extends PrimaryUuidBaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @OneToOne(() => User, (user) => user.balance)
  user: User;

  @OneToMany(() => Payment, (payment) => payment.balance)
  payments: Payment[];
}
