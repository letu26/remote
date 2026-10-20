import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PageQueryDto } from '../../../utils/pagination.js';
import { Trim } from '../../../utils/transforms.js';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../models/order.enums.js';

const ID_LIST = {
  min: 1,
  max: 50,
};

export class PreviewOrderDto {
  @IsArray()
  @ArrayMinSize(ID_LIST.min)
  @ArrayMaxSize(ID_LIST.max)
  @IsInt({ each: true })
  @Min(1, { each: true })
  itemIds: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shippingMethodId?: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(ID_LIST.min)
  @ArrayMaxSize(ID_LIST.max)
  @IsInt({ each: true })
  @Min(1, { each: true })
  itemIds: number[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  addressId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  shippingMethodId: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  note?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000_000)
  expectedTotal: number;
}

export class CancelOrderDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class OrderListQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class AdminOrderListQueryDto extends PageQueryDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  /** Lọc theo khách hàng (xem lịch sử mua của một tài khoản). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'Ngày phải theo dạng yyyy-MM-dd' })
  from?: string;

  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'Ngày phải theo dạng yyyy-MM-dd' })
  to?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(255)
  note?: string;
}

export class UpdateOrderPaymentDto {
  @IsIn([PaymentStatus.PAID, PaymentStatus.UNPAID])
  paymentStatus: PaymentStatus;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(255)
  note?: string;
}
