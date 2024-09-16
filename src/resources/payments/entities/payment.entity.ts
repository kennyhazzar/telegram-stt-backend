import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { PrimaryUuidBaseEntity } from '@core/db';
import { Balance } from '@resources/balance/entities/balance.entity';
import { PaymentStatus } from './payment-status.entity';

export enum PaymentType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
}

@Entity()
@Index(['amount'])
export class Payment extends PrimaryUuidBaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  confirmationRedirect: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: PaymentType })
  type: PaymentType;

  @OneToMany(() => PaymentStatus, (status) => status.payment)
  statuses: PaymentStatus[];

  @ManyToOne(() => Balance, (balance) => balance.payments)
  balance: Balance;
}
