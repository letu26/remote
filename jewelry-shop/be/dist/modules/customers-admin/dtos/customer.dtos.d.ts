import { PageQueryDto } from '../../../utils/pagination.js';
import { UserRole, UserStatus } from '../../users/models/user.entity.js';
export declare class CustomerListQueryDto extends PageQueryDto {
    q?: string;
    status?: UserStatus;
    role?: UserRole;
}
export declare class UpdateCustomerStatusDto {
    status: UserStatus;
    reason?: string;
}
export declare class UpdateCustomerRoleDto {
    role: UserRole;
}
