import { Controller, Get, UseGuards } from '@nestjs/common';
import { ImagekitService } from './imagekit.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('imagekit')
export class ImagekitController {
  constructor(private readonly imagekitService: ImagekitService) {}

  // @Post()
  // create(@Body() createImagekitDto: CreateImagekitDto) {
  //   return this.imagekitService.create(createImagekitDto);
  // }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.imagekitService.getAuthParams();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.imagekitService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateImagekitDto: UpdateImagekitDto) {
  //   return this.imagekitService.update(+id, updateImagekitDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.imagekitService.remove(+id);
  // }
}
