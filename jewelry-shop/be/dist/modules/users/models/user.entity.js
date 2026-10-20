var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../models/base.entity.js';
export var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
})(UserRole || (UserRole = {}));
export var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["LOCKED"] = "locked";
})(UserStatus || (UserStatus = {}));
let User = class User extends BaseEntity {
    fullName;
    email;
    phone;
    passwordHash;
    role;
    status;
};
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    Index({ unique: true }),
    Column({ length: 150 }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Index({ unique: true }),
    Column({ length: 20 }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    Column({ length: 255, select: false }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    Column({ type: 'enum', enum: UserRole, default: UserRole.USER }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
User = __decorate([
    Entity('users')
], User);
export { User };
//# sourceMappingURL=user.entity.js.map