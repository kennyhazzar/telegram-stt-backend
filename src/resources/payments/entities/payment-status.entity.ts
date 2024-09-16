import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { PrimaryUuidBaseEntity } from '@core/db';
import { Payment } from './payment.entity';

export enum PaymentStatusType {
  CREATED = 'created',
  SUCCEEDED = 'succeeded',
  ADDED = 'added',
  PENDING = 'pending',
  CANCELED = 'canceled',
}

@Entity('payment_status')
@Index(['status'])
export class PaymentStatus extends PrimaryUuidBaseEntity {
  @Column({
    type: 'enum',
    enum: PaymentStatusType,
    default: PaymentStatusType.CREATED,
  })
  status: PaymentStatusType;

  @ManyToOne(() => Payment, (payment) => payment.statuses)
  payment: Payment;
}
