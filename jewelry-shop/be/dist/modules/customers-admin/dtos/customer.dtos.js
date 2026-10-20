var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../../utils/pagination.js';
import { Trim } from '../../../utils/transforms.js';
import { UserRole, UserStatus } from '../../users/models/user.entity.js';
export class CustomerListQueryDto extends PageQueryDto {
    q;
    status;
    role;
}
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CustomerListQueryDto.prototype, "q", void 0);
__decorate([
    IsOptional(),
    IsEnum(UserStatus),
    __metadata("design:type", String)
], CustomerListQueryDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsEnum(UserRole),
    __metadata("design:type", String)
], CustomerListQueryDto.prototype, "role", void 0);
export class UpdateCustomerStatusDto {
    status;
    reason;
}
__decorate([
    IsEnum(UserStatus),
    __metadata("design:type", String)
], UpdateCustomerStatusDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], UpdateCustomerStatusDto.prototype, "reason", void 0);
export class UpdateCustomerRoleDto {
    role;
}
__decorate([
    IsEnum(UserRole),
    __metadata("design:type", String)
], UpdateCustomerRoleDto.prototype, "role", void 0);
//# sourceMappingURL=customer.dtos.js.map