import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { Trim } from '../../../utils/transforms.js';
import { PHONE_REGEX } from '../../users/dtos/user.dtos.js';

export class CreateAddressDto {
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  receiverName: string;

  @Trim()
  @Matches(PHONE_REGEX, { message: 'Số điện thoại không hợp lệ' })
  receiverPhone: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  provinceId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  wardId: number;

  @Trim()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  detail: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  receiverName?: string;

  @IsOptional()
  @Trim()
  @Matches(PHONE_REGEX, { message: 'Số điện thoại không hợp lệ' })
  receiverPhone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  provinceId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  wardId?: number;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  detail?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
