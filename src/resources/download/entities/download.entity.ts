import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { PrimaryUuidBaseEntity } from '@core/db';
import { User } from '@resources/user';
import { addHours } from 'date-fns';
import { Task } from '@resources/tasks/entities/task.entity';

export enum DownloadSourceEnum {
  GOOGLE_DRIVE = 'google_drive',
  YANDEX_DISK = 'yandex_disk',
  YOUTUBE = 'youtube',
  UPLOAD = 'upload',
}

export enum DownloadStatusEnum {
  CREATED = 'created',
  PROCESSING = 'processing',
  DONE = 'done',
  EXPIRED = 'expired',
  REJECTED = 'rejected',
  ERROR = 'error',
}

@Entity()
export class Download extends PrimaryUuidBaseEntity {
  @Column({
    type: 'enum',
    enum: DownloadSourceEnum,
    default: DownloadSourceEnum.UPLOAD,
    comment: 'Источник скачивания',
  })
  source: DownloadSourceEnum;

  @Column({
    type: 'enum',
    enum: DownloadStatusEnum,
    default: DownloadStatusEnum.CREATED,
    comment: 'Статус скачивания',
  })
  status: DownloadStatusEnum;

  @Column({ comment: 'Пользовательское название файла', nullable: true })
  title?: string;

  @Column({ comment: 'Ссылка на файл (если есть)', nullable: true })
  url?: string;

  @Column({ comment: 'Название исходного файла', nullable: true })
  filename?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: 'Длина аудио/видео',
    nullable: true,
  })
  duration?: number;

  @Column({})
  @Column({ comment: 'Текст ошибки, если что-то пошло не так', nullable: true })
  error?: string;

  @ManyToOne(() => User, (user) => user.balance)
  user: User;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Время до удаления файла',
  })
  ttlExpiresAt?: Date;

  @OneToOne(() => User, (user) => user.balance, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  task?: Task;

  @Column({
    nullable: true,
    comment: 'Сообщение с дополнительной информацией о скачивании',
  })
  message?: string;

  @BeforeInsert()
  @BeforeUpdate()
  calculateTTL() {
    const now = new Date();
    if (this.status === DownloadStatusEnum.DONE) {
      this.ttlExpiresAt = addHours(now, 24);
    } else {
      this.ttlExpiresAt = null;
    }
  }
}
