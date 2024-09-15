import { Entity, Column, ManyToOne } from 'typeorm';
import { PrimaryUuidBaseEntity } from '@core/db';
import { Payment } from './payment.entity';

export enum PaymentStatusType {
  SUCCEEDED = 'succeeded',
  PENDING = 'pending',
  CANCELED = 'canceled',
}

@Entity('payment_status')
export class PaymentStatus extends PrimaryUuidBaseEntity {
  @Column({ type: 'enum', enum: PaymentStatusType })
  status: PaymentStatusType;

  @ManyToOne(() => Payment, (payment) => payment.statuses)
  payment: Payment;
}
