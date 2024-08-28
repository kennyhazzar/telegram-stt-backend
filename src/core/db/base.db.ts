import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

abstract class DateBaseEntity {
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export abstract class PrimaryUuidBaseEntity extends DateBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}

export abstract class PrimaryIncrementBaseEntity extends DateBaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;
}