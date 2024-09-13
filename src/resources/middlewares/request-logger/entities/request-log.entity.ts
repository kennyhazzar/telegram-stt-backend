import {
  Entity,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { PrimaryUuidBaseEntity } from '@core/db';

@Entity()
export class RequestLog extends PrimaryUuidBaseEntity {
  @Column()
  method: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  statusCode: number;

  @Column('int', { nullable: true })
  duration: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  body: Record<string, any>;
}
