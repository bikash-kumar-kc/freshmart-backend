// import { packagingType } from './../db/schema';
import { Inject, Injectable } from '@nestjs/common';
// import { CreateLookupDto } from './dto/create-lookup.dto';
// import { UpdateLookupDto } from './dto/update-lookup.dto';
import { DB_PROVIDER } from '../db/db.provider';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class LookupService {
  constructor(
    @Inject(DB_PROVIDER) private readonly db: LibSQLDatabase<typeof schema>,
  ) {}
  // create(createLookupDto: CreateLookupDto) {
  //   return 'This action adds a new lookup';
  // }

  // findAll() {
  //   return `This action returns all lookup`;
  // }

  findProductName() {
    return this.db
      .select({
        productId: schema.productName.id,
        productName: schema.productName.name,
      })
      .from(schema.productName)
      .where(eq(schema.productName.isVerified, true));
  }

  findCategory() {
    return this.db
      .select({
        categoryId: schema.category.id,
        categoryName: schema.category.categoryName,
      })
      .from(schema.category)
      .where(eq(schema.category.isVerified, true));
  }

  findPackagingType() {
    return this.db
      .select({
        packagingId: schema.packagingType.id,
        packagingName: schema.packagingType.name,
      })
      .from(schema.packagingType)
      .where(eq(schema.packagingType.isVerified, true));
  }

  findMeasurementType() {
    return this.db
      .select({
        measurementId: schema.measurementType.id,
        measurementName: schema.measurementType.name,
      })
      .from(schema.measurementType)
      .where(eq(schema.measurementType.isVerified, true));
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} lookup`;
  // }

  // update(id: number, updateLookupDto: UpdateLookupDto) {
  //   return `This action updates a #${id} lookup`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} lookup`;
  // }
}
