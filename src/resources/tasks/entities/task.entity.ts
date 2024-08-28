import { PrimaryUuidBaseEntity } from '@core/db';
import { User } from '@resources/users/entities/user.entity';
import { Entity, Column, ManyToOne } from 'typeorm';

@Entity('tasks')
export class Task extends PrimaryUuidBaseEntity {
  @Column({
    type: 'enum',
    enum: ['created', 'processing', 'done', 'rejected', 'error'],
    default: 'created',
  })
  status: 'created' | 'processing' | 'done' | 'rejected' | 'error';

  @Column({ type: 'varchar', length: 255 })
  inputFileId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  outputFileId: string;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @ManyToOne(() => User, (user) => user.balance)
  user: User;
}