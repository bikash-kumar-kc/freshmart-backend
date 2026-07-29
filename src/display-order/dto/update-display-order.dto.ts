import { PartialType } from '@nestjs/swagger';
import { CreateDisplayOrderDto } from './create-display-order.dto';

export class UpdateDisplayOrderDto extends PartialType(CreateDisplayOrderDto) {}
