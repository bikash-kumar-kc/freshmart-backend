import { PartialType } from '@nestjs/swagger';
import { CreateImagekitDto } from './create-imagekit.dto';

export class UpdateImagekitDto extends PartialType(CreateImagekitDto) {}
