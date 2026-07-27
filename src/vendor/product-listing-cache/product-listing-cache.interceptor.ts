import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { REDIS_PROVIDER } from '../../redis/redis.provider';
import Redis from 'ioredis';
import { Request, Response } from 'express';
import { IPayloadType } from '../../auth/types/token.type';
import { ICreateProductListingDto } from '../dto/create-product-listing.dto';
import { Observable, of, tap } from 'rxjs';
import { CACHE_TTL } from '../constants/cache.constant';
import { IProductListingType } from '../types/product-listing.type';
import { idempotencyKeyList } from '../constants/idempotencyKeys.constant';

interface IUpdateRequest extends Request {
  user: IPayloadType;
}

@Injectable()
export class ProductListingCacheInterceptor implements NestInterceptor {
  constructor(@Inject(REDIS_PROVIDER) private readonly redis: Redis) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: IUpdateRequest = context.switchToHttp().getRequest();
    const vendorId = request.user.vendorId;
    const productId = request?.params?.id as string | undefined;
    const cacheKey = `productlisting:createProduct:${vendorId}`;
    const idempotencyKey = request.headers[
      idempotencyKeyList.productListingIdempotencyKey
    ] as string | undefined;
    const idempotencyRedisKey = `productlisting:createProduct:${vendorId}`;

    if (request.method === 'GET' && productId) {
      const updatedCacheKey = cacheKey + `:${productId}`;
      const cached = await this.redis.get(updatedCacheKey);
      if (cached) {
        const parsedCached = (await JSON.parse(
          cached,
        )) as ICreateProductListingDto;

        return of(parsedCached);
      }
    }

    if (request.method === 'POST' && idempotencyKey) {
      const updatedIdempotencyRedisKey =
        idempotencyRedisKey + `:${idempotencyKey}`;
      const claimed = await this.redis.set(
        updatedIdempotencyRedisKey,
        'processing',
        'EX',
        CACHE_TTL.idempotency_ttl,
        'NX',
      );

      if (!claimed) {
        return of({ message: 'Product already listed' });
      }
    }

    if (request.method === 'POST') {
      return next.handle().pipe(
        tap((data) => {
          const response = data as IProductListingType;
          const productId = response.id;
          const updatedKey = cacheKey + `:${productId}`;
          const updatedRedisKey = idempotencyRedisKey + `:${idempotencyKey}`;
          void this.redis
            .set(
              updatedKey,
              JSON.stringify(data),
              'EX',
              CACHE_TTL.product_listing_ttl,
            )
            .catch((error) => {
              console.log('[INTERCEPTOR] PRODUCT LISTING CACHE', error);
            });

          if (idempotencyKey) {
            void this.redis.set(
              updatedRedisKey,
              'true',
              'EX',
              CACHE_TTL.idempotency_ttl,
            );
          }
        }),
      );
    }

    return next.handle();
  }
}
