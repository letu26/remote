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
let SiteSetting = class SiteSetting extends BaseEntity {
    key;
    value;
};
__decorate([
    Index({ unique: true }),
    Column({ name: 'setting_key', length: 100 }),
    __metadata("design:type", String)
], SiteSetting.prototype, "key", void 0);
__decorate([
    Column({ type: 'text' }),
    __metadata("design:type", String)
], SiteSetting.prototype, "value", void 0);
SiteSetting = __decorate([
    Entity('site_settings')
], SiteSetting);
export { SiteSetting };
//# sourceMappingURL=site-setting.entity.js.map