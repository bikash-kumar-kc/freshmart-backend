import { Test, TestingModule } from '@nestjs/testing';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';

describe('AdminNotificationsController', () => {
  let controller: AdminNotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminNotificationsController],
      providers: [AdminNotificationsService],
    }).compile();

    controller = module.get<AdminNotificationsController>(AdminNotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
