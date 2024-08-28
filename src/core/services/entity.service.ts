import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  FindManyOptions,
  FindOneOptions,
  FindOptionsRelationByString,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

export interface FindOneParams<T, U = T> {
  cacheValue?: string;
  repository: Repository<T>;
  ttl?: number;
  select?: FindOneOptions<T>['select'];
  relations?: FindOptionsRelations<T> | FindOptionsRelationByString;
  where?: FindOptionsWhere<T>[] | FindOptionsWhere<T>;
  transform?: (entity: T) => U;
  bypassCache?: boolean;
}

export interface FindManyParams<T, U = T> {
  cacheValue: string;
  repository: Repository<T>;
  ttl?: number;
  select?: FindManyOptions<T>['select'];
  relations?: FindOptionsRelations<T> | FindOptionsRelationByString;
  where?: FindOptionsWhere<T>[] | FindOptionsWhere<T>;
  order?: FindManyOptions<T>['order'];
  skip?: number;
  take?: number;
  transform?: (entities: T[]) => Promise<U[]>;
  bypassCache?: boolean;
  queryBuilder?: (qb: SelectQueryBuilder<T>) => SelectQueryBuilder<T>;
  queryBuilderAlias?: string;
}

@Injectable()
export class EntityService {
  constructor(@Inject('CACHE_MANAGER') private readonly cacheManager: Cache) {}

  async findOne<T, U = T>({
    cacheValue,
    repository,
    ttl = 3600,
    select,
    relations,
    where,
    transform,
    bypassCache = false,
  }: FindOneParams<T, U>): Promise<U | undefined> {
    const cacheKey = cacheValue
      ? this.getCacheKey(repository.metadata.name, cacheValue)
      : '';

    let entity: T | undefined;

    if (!bypassCache || !cacheKey) {
      entity = await this.cacheManager.get<T>(cacheKey);
    }

    if (!entity) {
      const options: FindManyOptions<T> = {
        where: { ...where },
        relations,
        select,
      };

      entity = await repository.findOne(options);

      if (!entity) {
        return undefined;
      }

      await this.cacheManager.set(
        this.getCacheKey(
          repository.metadata.name,
          cacheValue || (entity as any)?.id,
        ),
        entity,
        { ttl } as any,
      );

      return transform ? transform(entity) : (entity as unknown as U);
    }

    return transform ? transform(entity) : (entity as unknown as U);
  }

  async findMany<T, U = T>({
    cacheValue,
    repository,
    ttl = 3600,
    select,
    relations,
    where,
    order,
    skip,
    take,
    transform,
    bypassCache = false,
    queryBuilder,
    queryBuilderAlias,
  }: FindManyParams<T, U>): Promise<U[] | undefined> {
    const cacheKey = `${repository.metadata.name.toLowerCase()}_${cacheValue}`;

    let entities: T[] | undefined;

    if (!bypassCache) {
      entities = await this.cacheManager.get<T[]>(cacheKey);
    }

    if (!entities) {
      if (queryBuilder) {
        let qb = repository.createQueryBuilder(queryBuilderAlias);
        qb = queryBuilder(qb);
        entities = await qb.getRawMany();
      } else {
        const options: FindManyOptions<T> = {
          where: { ...where },
          relations,
          select,
          order,
          skip,
          take,
        };

        entities = await repository.find(options);
      }

      if (!entities || entities.length === 0) {
        return [];
      }

      await this.cacheManager.set(cacheKey, entities, { ttl } as any);

      return (await transform)
        ? await transform(entities)
        : (entities as unknown as U[]);
    }

    return (await transform)
      ? await transform(entities)
      : (entities as unknown as U[]);
  }

  getCacheKey(key: string, cacheValue: string) {
    return `${key.toLowerCase()}_${cacheValue}`;
  }
}
