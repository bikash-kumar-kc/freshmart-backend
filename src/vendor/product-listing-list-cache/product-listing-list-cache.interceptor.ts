// product-listing/interceptors/product-listing-list-cache.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';
import Redis from 'ioredis';
import { REDIS_PROVIDER } from '../../redis/redis.provider';
import { IPayloadType } from '../../auth/types/token.type';
import { Request } from 'express';
import { CACHE_TTL } from '../constants/cache.constant';

interface IAuthedRequest extends Request {
  user: IPayloadType;
}

@Injectable()
export class ProductListingListCacheInterceptor implements NestInterceptor {
  constructor(@Inject(REDIS_PROVIDER) private readonly redis: Redis) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: IAuthedRequest = context.switchToHttp().getRequest();
    const vendorId = request.user.vendorId;
    const isVerified = request.query.verified as string;

    const cacheKey = `productlisting:getproduct:${isVerified}:${vendorId}`;

    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return of(JSON.parse(cached));
    }

    return next.handle().pipe(
      tap((data) => {
        void this.redis
          .set(
            cacheKey,
            JSON.stringify(data),
            'EX',
            CACHE_TTL.product_listing_list_ttl,
          )
          .catch((error) => {
            console.log('[INTERCEPTOR] PRODUCT LISTING LIST CACHE', error);
          });
      }),
    );
  }
}
