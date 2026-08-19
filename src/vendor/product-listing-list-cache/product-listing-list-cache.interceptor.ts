import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, tap, map } from 'rxjs';
import Redis from 'ioredis';
import { REDIS_PROVIDER } from '../../redis/redis.provider';
import { IPayloadType } from '../../auth/types/token.type';
import { Request } from 'express';
import { CACHE_TTL } from '../constants/cache.constant';
import { ProductListingListResponseDto } from '../dto/response.dto';

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
    const currentPage = (request.query.page as string) ?? '1';

    const cacheKey = `productlisting:getproduct:${isVerified}:${vendorId}:${currentPage}`;

    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return of(JSON.parse(cached));
    }

    return next.handle().pipe(
      tap((data: ProductListingListResponseDto) => {
        const response = this.refineResponseData(data);
        void this.redis
          .set(
            cacheKey,
            JSON.stringify(response),
            'EX',
            CACHE_TTL.product_listing_list_ttl,
          )
          .catch((error) => {
            console.log('[INTERCEPTOR] PRODUCT LISTING LIST CACHE', error);
          });
      }),
      map((data: ProductListingListResponseDto) => {
        return this.refineResponseData(data);
      }),
    );
  }

  private refineResponseData(data: ProductListingListResponseDto) {
    const { data: productListingData, ...paginationData } = data;

    const refinedData = productListingData.map((d) => {
      const {
        id,
        localName,
        type,
        variants,
        isAcceptedByAdmin,
        isRejectedByAdmin,
        createdAt,
      } = d;

      return {
        id,
        localName,
        type,
        variants,
        isAcceptedByAdmin,
        isRejectedByAdmin,
        createdAt,
      };
    });

    return {
      data: [...refinedData],
      ...paginationData,
    };
  }
}
