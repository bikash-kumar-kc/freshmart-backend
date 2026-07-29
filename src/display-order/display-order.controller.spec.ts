import { Test, TestingModule } from '@nestjs/testing';
import { DisplayOrderController } from './display-order.controller';
import { DisplayOrderService } from './display-order.service';

describe('DisplayOrderController', () => {
  let controller: DisplayOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisplayOrderController],
      providers: [DisplayOrderService],
    }).compile();

    controller = module.get<DisplayOrderController>(DisplayOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
