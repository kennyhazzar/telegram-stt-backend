import { Entity, Column, DeleteDateColumn, OneToMany, Unique } from 'typeorm';
import { PrimaryUuidBaseEntity } from '@core/db';
import { Balance } from '@resources/balance/entities/balance.entity';
import { Task } from '@resources/tasks/entities/task.entity';

@Entity('users')
export class User extends PrimaryUuidBaseEntity {
  @Column({ type: 'bigint', unique: true })
  telegramId: number;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  secondName: string;

  @Column({ type: 'varchar', length: 32, unique: true, nullable: true })
  md5: string;

  @OneToMany(() => Balance, (balance) => balance.user)
  balance: Balance[];

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];
}
