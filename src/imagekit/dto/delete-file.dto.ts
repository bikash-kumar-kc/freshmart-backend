import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  fileId!: string;
}

export class IDeleteImagesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  fileIds!: string[];
}
