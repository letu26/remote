import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator';

export class ViewedProductDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  @Max(1000)
  count: number;
}

export class RecommendationDto {
  /** Lịch sử xem lưu ở trình duyệt (khách vãng lai cũng có). */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ViewedProductDto)
  viewed?: ViewedProductDto[];

  /** Sản phẩm đang xem, không gợi ý lại chính nó. */
  @IsOptional()
  @IsInt()
  @Min(1)
  excludeProductId?: number;
}
