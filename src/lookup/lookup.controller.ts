import { Controller, Get } from '@nestjs/common';
import { LookupService } from './lookup.service';

@Controller('lookup')
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  // @Post()
  // create(@Body() createLookupDto: CreateLookupDto) {
  //   return this.lookupService.create(createLookupDto);
  // }

  @Get('/productname')
  findProductName() {
    return this.lookupService.findProductName();
  }

  @Get('/categoryname')
  findCategory() {
    return this.lookupService.findCategory();
  }

  @Get('/packagingtype')
  findPackagingType() {
    return this.lookupService.findPackagingType();
  }

  @Get('/measurementtype')
  findMeasurementType() {
    return this.lookupService.findMeasurementType();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.lookupService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateLookupDto: UpdateLookupDto) {
  //   return this.lookupService.update(+id, updateLookupDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.lookupService.remove(+id);
  // }
}
