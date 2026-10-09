import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductListingService } from './admin-product-listing.service';

describe('AdminProductListingService', () => {
  let service: AdminProductListingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminProductListingService],
    }).compile();

    service = module.get<AdminProductListingService>(AdminProductListingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
