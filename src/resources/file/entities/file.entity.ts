import { Entity } from 'typeorm';
import { PrimaryUuidBaseEntity } from '@core/db';

@Entity()
export class File extends PrimaryUuidBaseEntity {}
