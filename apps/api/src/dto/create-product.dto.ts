import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsInt()
  @IsPositive()
  price: number;

  @IsString()
  @MinLength(1)
  unit: string;
}