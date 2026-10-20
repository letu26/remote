import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AddWishlistDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;
}
