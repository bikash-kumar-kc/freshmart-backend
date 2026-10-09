import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductListingController } from './admin-product-listing.controller';
import { AdminProductListingService } from './admin-product-listing.service';

describe('AdminProductListingController', () => {
  let controller: AdminProductListingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProductListingController],
      providers: [AdminProductListingService],
    }).compile();

    controller = module.get<AdminProductListingController>(AdminProductListingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
