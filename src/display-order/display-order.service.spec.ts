import { Test, TestingModule } from '@nestjs/testing';
import { DisplayOrderService } from './display-order.service';

describe('DisplayOrderService', () => {
  let service: DisplayOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisplayOrderService],
    }).compile();

    service = module.get<DisplayOrderService>(DisplayOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
