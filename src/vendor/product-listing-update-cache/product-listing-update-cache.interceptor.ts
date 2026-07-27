import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable, tap } from 'rxjs';
import { IUpdateProductListingDto } from '../dto/update-product-listing.dto';
import { REDIS_PROVIDER } from '../../redis/redis.provider';
import Redis from 'ioredis';
import { CACHE_TTL } from '../constants/cache.constant';

interface IUpdatedUpdateProductListingDto extends IUpdateProductListingDto {
  id: number;
  vendorId: string;
}

@Injectable()
export class ProductListingUpdateCacheInterceptor implements NestInterceptor {
  constructor(@Inject(REDIS_PROVIDER) private readonly redis: Redis) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<IUpdatedUpdateProductListingDto>,
  ): Observable<any> {
    return next.handle().pipe(
      tap((data) => {
        const { vendorId, id } = data;
        const cacheKey = `productlisting:createProduct:${vendorId}:${id}`;
        const productsCacheKey = `productlisting:getproduct:${false}:${vendorId}`;

        // override...
        void this.redis
          .set(
            cacheKey,
            JSON.stringify(data),
            'EX',
            CACHE_TTL.product_listing_list_ttl,
          )
          .catch((error) => {
            console.error('[CACHE] Failed to update cache', error);
          });

        void this.redis.del(productsCacheKey).catch((error) => {
          console.error('[CACHE] Failed to invalidate cache', error);
        });
      }),
      map((data) => ({ productListingId: data.id })),
    );
  }
}
