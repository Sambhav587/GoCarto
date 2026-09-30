import {
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumberString()
  categoryId?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  isActive?: string;
}