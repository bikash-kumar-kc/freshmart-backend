import { Test, TestingModule } from '@nestjs/testing';
import { AdminQuotationsController } from './admin-quotations.controller';
import { AdminQuotationsService } from './admin-quotations.service';

describe('AdminQuotationsController', () => {
  let controller: AdminQuotationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminQuotationsController],
      providers: [AdminQuotationsService],
    }).compile();

    controller = module.get<AdminQuotationsController>(AdminQuotationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
