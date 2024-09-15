import {
  Entity,
  Column,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PrimaryUuidBaseEntity } from '@core/db';
import { Balance } from '@resources/balance/entities';
import { Task } from '@resources/tasks/entities/task.entity';
import { Download } from '../../download/entities';

export enum UserSourceEnum {
  WEB_APP = 'webapp',
  BOT = 'bot',
}

@Entity('users')
@Index(['telegramId'], { unique: true })
@Index(['firstName'], { fulltext: true })
@Index(['username'], { fulltext: true })
@Index(['secondName'], { fulltext: true })
export class User extends PrimaryUuidBaseEntity {
  @Column({ name: 'telegram_id', type: 'bigint', unique: true })
  telegramId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  secondName: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  md5: string;

  @OneToOne(() => Balance, { onDelete: 'CASCADE' })
  @JoinColumn()
  balance: Balance;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];

  @OneToMany(() => Download, (download) => download.user, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  download: Download[];

  @Column({
    type: 'enum',
    enum: UserSourceEnum,
    default: UserSourceEnum.WEB_APP,
    comment: 'Источник регистрации',
  })
  source: UserSourceEnum;

  @Column({
    default: 'en',
  })
  languageCode: string;

  @Column({
    default: false,
  })
  isBlocked: boolean;
}
