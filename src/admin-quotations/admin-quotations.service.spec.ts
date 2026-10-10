import { Test, TestingModule } from '@nestjs/testing';
import { AdminQuotationsService } from './admin-quotations.service';

describe('AdminQuotationsService', () => {
  let service: AdminQuotationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminQuotationsService],
    }).compile();

    service = module.get<AdminQuotationsService>(AdminQuotationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
