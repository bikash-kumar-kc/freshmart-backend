import { Test, TestingModule } from '@nestjs/testing';
import { AdminVendorsController } from './admin-vendors.controller';
import { AdminVendorsService } from './admin-vendors.service';

describe('AdminVendorsController', () => {
  let controller: AdminVendorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminVendorsController],
      providers: [AdminVendorsService],
    }).compile();

    controller = module.get<AdminVendorsController>(AdminVendorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
