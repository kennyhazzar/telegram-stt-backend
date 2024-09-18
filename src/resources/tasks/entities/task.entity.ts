import { PrimaryUuidBaseEntity } from '@core/db';
import { User } from '@resources/user/entities/user.entity';
import { Entity, Column, ManyToOne, OneToOne, Index, JoinColumn } from 'typeorm';
import { Download } from '@resources/download/entities';

export enum TaskStatusEnum {
  CREATED = 'created',
  PROCESSING = 'processing',
  DONE = 'done',
  REJECTED = 'rejected',
  ERROR = 'error',
}

@Entity('tasks')
@Index(['status'])
@Index(['message'])
export class Task extends PrimaryUuidBaseEntity {
  @Column({
    type: 'enum',
    enum: TaskStatusEnum,
    default: TaskStatusEnum.CREATED,
  })
  status: TaskStatusEnum;

  @Column({ nullable: true })
  totalCost: number;

  @Column({ default: 'Задача создана' })
  message: string;

  @OneToOne(() => Download, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  download: Download;

  @ManyToOne(() => User, (user) => user.balance)
  user: User;
}
