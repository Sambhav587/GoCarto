import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  categoryId?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  unit?: string;

  @IsOptional()
  isActive?: boolean;
}