import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductLiveService } from './admin-product-live.service';

describe('AdminProductLiveService', () => {
  let service: AdminProductLiveService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminProductLiveService],
    }).compile();

    service = module.get<AdminProductLiveService>(AdminProductLiveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
