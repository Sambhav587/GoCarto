import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @MinLength(10)
  deliveryAddress: string;

  @IsOptional()
  @IsString()
  @IsIn(['cod', 'card', 'upi'])
  paymentMethod?: string;
}