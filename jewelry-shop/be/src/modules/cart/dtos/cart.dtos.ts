import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, Max, Min } from 'class-validator';

export const MAX_LINE_QUANTITY = 10;

export class AddCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  variantId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LINE_QUANTITY)
  quantity?: number;
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LINE_QUANTITY)
  quantity: number;
}

export class RemoveCartItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  @Min(1, { each: true })
  itemIds: number[];
}
