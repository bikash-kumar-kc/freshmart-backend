import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductLiveController } from './admin-product-live.controller';
import { AdminProductLiveService } from './admin-product-live.service';

describe('AdminProductLiveController', () => {
  let controller: AdminProductLiveController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProductLiveController],
      providers: [AdminProductLiveService],
    }).compile();

    controller = module.get<AdminProductLiveController>(AdminProductLiveController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
