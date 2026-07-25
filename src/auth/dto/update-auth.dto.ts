import { PartialType } from '@nestjs/swagger';
import { CreateAuthDto } from './setup-account.dto';

export class UpdateAuthDto extends PartialType(CreateAuthDto) {}
