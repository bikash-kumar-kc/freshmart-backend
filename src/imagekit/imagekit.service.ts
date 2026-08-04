import { Injectable } from '@nestjs/common';
import { CreateImagekitDto } from './dto/create-imagekit.dto';
import { UpdateImagekitDto } from './dto/update-imagekit.dto';

@Injectable()
export class ImagekitService {
  create(createImagekitDto: CreateImagekitDto) {
    return 'This action adds a new imagekit';
  }

  findAll() {
    return `This action returns all imagekit`;
  }

  findOne(id: number) {
    return `This action returns a #${id} imagekit`;
  }

  update(id: number, updateImagekitDto: UpdateImagekitDto) {
    return `This action updates a #${id} imagekit`;
  }

  remove(id: number) {
    return `This action removes a #${id} imagekit`;
  }
}
