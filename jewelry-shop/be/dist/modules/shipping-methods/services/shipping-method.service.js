var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { isForeignKeyReferencedError } from '../../../utils/db-error.util.js';
import { ShippingMethodRepository } from '../repositories/shipping-method.repository.js';
let ShippingMethodService = class ShippingMethodService {
    methods;
    constructor(methods) {
        this.methods = methods;
    }
    async listPublic() {
        const rows = await this.methods.findAll(true);
        return rows.map(({ id, name, description, fee }) => ({ id, name, description, fee }));
    }
    listAll() {
        return this.methods.findAll(false);
    }
    async create(dto) {
        const id = await this.methods.insert({
            name: dto.name,
            description: dto.description ?? null,
            fee: dto.fee,
            isActive: dto.isActive ?? true,
        });
        return this.getOrFail(id);
    }
    async update(id, dto) {
        await this.getOrFail(id);
        await this.methods.update(id, dto);
        return this.getOrFail(id);
    }
    async remove(id) {
        await this.getOrFail(id);
        const orders = await this.methods.countOrders(id);
        if (orders > 0)
            throw this.inUse(orders);
        try {
            await this.methods.delete(id);
        }
        catch (error) {
            if (isForeignKeyReferencedError(error))
                throw this.inUse(1);
            throw error;
        }
    }
    inUse(orders) {
        return new BusinessException(ErrorCode.RESOURCE_IN_USE, `Phương thức vận chuyển đã có ${orders} đơn hàng sử dụng nên không thể xóa. Hãy tắt (isActive=false) thay vì xóa.`, HttpStatus.CONFLICT);
    }
    async getOrFail(id) {
        const method = await this.methods.findById(id);
        if (!method) {
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy phương thức vận chuyển', HttpStatus.NOT_FOUND);
        }
        return method;
    }
};
ShippingMethodService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ShippingMethodRepository])
], ShippingMethodService);
export { ShippingMethodService };
//# sourceMappingURL=shipping-method.service.js.map