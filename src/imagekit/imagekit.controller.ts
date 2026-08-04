import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ImagekitService } from './imagekit.service';
import { CreateImagekitDto } from './dto/create-imagekit.dto';
import { UpdateImagekitDto } from './dto/update-imagekit.dto';

@Controller('imagekit')
export class ImagekitController {
  constructor(private readonly imagekitService: ImagekitService) {}

  @Post()
  create(@Body() createImagekitDto: CreateImagekitDto) {
    return this.imagekitService.create(createImagekitDto);
  }

  @Get()
  findAll() {
    return this.imagekitService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.imagekitService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImagekitDto: UpdateImagekitDto) {
    return this.imagekitService.update(+id, updateImagekitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.imagekitService.remove(+id);
  }
}
