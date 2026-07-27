import { ICreateProductListingDto } from '../dto/create-product-listing.dto';

export interface IProductListingType extends ICreateProductListingDto {
  id: number;
}
