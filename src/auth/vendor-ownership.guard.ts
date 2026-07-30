import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { eq } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DB_PROVIDER } from '../db/db.provider';
import * as schema from '../db/schema';
import { IPayloadType } from './types/token.type';

@Injectable()
export class VendorOwnershipGuard implements CanActivate {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request['user'] as IPayloadType;

    if (user.role !== 'vendor' || !user.vendorId) {
      throw new ForbiddenException('Only vendors can access this resource');
    }

    const listingId = Number(request.params.id);
    if (!listingId) {
      throw new ForbiddenException('Invalid resource id');
    }

    const listing = await this.db.query.productListing.findFirst({
      where: eq(schema.productListing.id, listingId),
      with: {
        variants: true,
      },
    });


    if (!listing) {
      throw new NotFoundException('Product listing not found');
    }

    const isWon = listing.vendorId === user.vendorId;
    if (!isWon) {
      throw new ForbiddenException('You do not own this resource');
    }

    request['resource'] = listing;

    return true;
  }
}
