import { Body, Controller, Delete, Get, Param } from '@nestjs/common';
import { ImagekitService } from './imagekit.service';
import { DeleteFileDto, IDeleteImagesDto } from './dto/delete-file.dto';

@Controller('imagekit')
export class ImagekitController {
  constructor(private readonly imagekitService: ImagekitService) {}

  // @Post()
  // create(@Body() createImagekitDto: CreateImagekitDto) {
  //   return this.imagekitService.create(createImagekitDto);
  // }

  @Get()
  getAuthParams() {
    return this.imagekitService.getAuthParams();
  }

  @Delete('/files')
  deleteFiles(@Body() body: IDeleteImagesDto) {
    const { fileIds } = body;
    return this.imagekitService.deleteFiles(fileIds);
  }

  @Delete('/:fileId')
  deleteFile(@Param() params: DeleteFileDto) {
    return this.imagekitService.deleteFile(params.fileId);
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
