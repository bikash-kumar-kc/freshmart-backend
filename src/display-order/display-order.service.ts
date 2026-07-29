import { Injectable } from '@nestjs/common';
import { CreateDisplayOrderDto } from './dto/create-display-order.dto';
import { UpdateDisplayOrderDto } from './dto/update-display-order.dto';

@Injectable()
export class DisplayOrderService {
  create(createDisplayOrderDto: CreateDisplayOrderDto) {
    return 'This action adds a new displayOrder';
  }

  findAll() {
    return `This action returns all displayOrder`;
  }

  findOne(id: number) {
    return `This action returns a #${id} displayOrder`;
  }

  update(id: number, updateDisplayOrderDto: UpdateDisplayOrderDto) {
    return `This action updates a #${id} displayOrder`;
  }

  remove(id: number) {
    return `This action removes a #${id} displayOrder`;
  }
}
