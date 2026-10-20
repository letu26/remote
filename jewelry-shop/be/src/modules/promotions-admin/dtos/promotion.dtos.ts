import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  registerDecorator,
} from 'class-validator';
import { PageQueryDto } from '../../../utils/pagination.js';
import { Trim } from '../../../utils/transforms.js';
import { PROMOTION_STATUSES, type PromotionStatus } from '../services/promotion-status.js';

/** ISO 8601 có múi giờ rõ ràng (hậu tố Z hoặc ±hh:mm), ví dụ 2026-10-18T09:00:00+07:00. */
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

function IsIsoDateTimeWithZone() {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isIsoDateTimeWithZone',
      target: object.constructor,
      propertyName,
      options: { message: 'Phải là thời gian ISO 8601 có múi giờ (ví dụ 2026-10-18T09:00:00+07:00 hoặc ...Z)' },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && ISO_WITH_ZONE.test(value) && !Number.isNaN(Date.parse(value)),
      },
    });
}

export class PromotionListQueryDto extends PageQueryDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(PROMOTION_STATUSES)
  status?: PromotionStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId?: number;
}

export class CreatePromotionDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  productIds: number[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  discountPercent: number;

  @IsIsoDateTimeWithZone()
  startsAt: string;

  @IsIsoDateTimeWithZone()
  endsAt: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePromotionDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  discountPercent?: number;

  @IsOptional()
  @IsIsoDateTimeWithZone()
  startsAt?: string;

  @IsOptional()
  @IsIsoDateTimeWithZone()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
