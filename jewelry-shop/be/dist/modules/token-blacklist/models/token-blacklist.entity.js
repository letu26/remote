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
export var BlacklistScope;
(function (BlacklistScope) {
    BlacklistScope["TOKEN"] = "token";
    BlacklistScope["ALL_BEFORE"] = "all_before";
})(BlacklistScope || (BlacklistScope = {}));
export var BlacklistReason;
(function (BlacklistReason) {
    BlacklistReason["LOGOUT"] = "logout";
    BlacklistReason["CHANGE_PASSWORD"] = "change_password";
    BlacklistReason["RESET_PASSWORD"] = "reset_password";
})(BlacklistReason || (BlacklistReason = {}));
let TokenBlacklist = class TokenBlacklist extends BaseEntity {
    userId;
    scope;
    jti;
    issuedBefore;
    reason;
    expiresAt;
};
__decorate([
    Column({ unsigned: true }),
    __metadata("design:type", Number)
], TokenBlacklist.prototype, "userId", void 0);
__decorate([
    Column({ type: 'enum', enum: BlacklistScope }),
    __metadata("design:type", String)
], TokenBlacklist.prototype, "scope", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TokenBlacklist.prototype, "jti", void 0);
__decorate([
    Column({ type: 'datetime', precision: 3, nullable: true }),
    __metadata("design:type", Object)
], TokenBlacklist.prototype, "issuedBefore", void 0);
__decorate([
    Column({ type: 'enum', enum: BlacklistReason }),
    __metadata("design:type", String)
], TokenBlacklist.prototype, "reason", void 0);
__decorate([
    Column({ type: 'datetime' }),
    __metadata("design:type", Date)
], TokenBlacklist.prototype, "expiresAt", void 0);
TokenBlacklist = __decorate([
    Entity('token_blacklist')
], TokenBlacklist);
export { TokenBlacklist };
//# sourceMappingURL=token-blacklist.entity.js.map