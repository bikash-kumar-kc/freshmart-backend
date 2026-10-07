import { Test, TestingModule } from '@nestjs/testing';
import { AdminVendorsService } from './admin-vendors.service';

describe('AdminVendorsService', () => {
  let service: AdminVendorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminVendorsService],
    }).compile();

    service = module.get<AdminVendorsService>(AdminVendorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
