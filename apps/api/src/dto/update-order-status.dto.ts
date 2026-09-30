import { IsIn, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn([
    'pending',
    'confirmed',
    'preparing',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ])
  status: string;
}