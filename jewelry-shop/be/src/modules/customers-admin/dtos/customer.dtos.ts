import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../../utils/pagination.js';
import { Trim } from '../../../utils/transforms.js';
import { UserRole, UserStatus } from '../../users/models/user.entity.js';

export class CustomerListQueryDto extends PageQueryDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateCustomerStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class UpdateCustomerRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
