import {
  IsIn,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @MinLength(10)
  deliveryAddress: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  @IsIn(['cod', 'card', 'upi'])
  paymentMethod?: string;
}