import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DisplayOrderService } from './display-order.service';
import { CreateDisplayOrderDto } from './dto/create-display-order.dto';
import { UpdateDisplayOrderDto } from './dto/update-display-order.dto';

@Controller('display-order')
export class DisplayOrderController {
  constructor(private readonly displayOrderService: DisplayOrderService) {}

  @Post()
  create(@Body() createDisplayOrderDto: CreateDisplayOrderDto) {
    return this.displayOrderService.create(createDisplayOrderDto);
  }

  @Get()
  findAll() {
    return this.displayOrderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.displayOrderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDisplayOrderDto: UpdateDisplayOrderDto) {
    return this.displayOrderService.update(+id, updateDisplayOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.displayOrderService.remove(+id);
  }
}
