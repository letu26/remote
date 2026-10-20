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
import { AddressRepository } from '../repositories/address.repository.js';
export const MAX_ADDRESSES = 10;
let AddressService = class AddressService {
    addresses;
    constructor(addresses) {
        this.addresses = addresses;
    }
    list(userId) {
        return this.addresses.findAll(userId);
    }
    async create(userId, dto) {
        await this.assertLocation(dto.provinceId, dto.wardId);
        const result = await this.addresses.create(userId, {
            receiverName: dto.receiverName,
            receiverPhone: dto.receiverPhone,
            provinceId: dto.provinceId,
            wardId: dto.wardId,
            detail: dto.detail,
        }, dto.isDefault === true, MAX_ADDRESSES);
        if (!result.ok) {
            throw new BusinessException(ErrorCode.ADDRESS_LIMIT_EXCEEDED, `Mỗi tài khoản chỉ lưu tối đa ${MAX_ADDRESSES} địa chỉ`, HttpStatus.BAD_REQUEST);
        }
        return this.getOrFail(userId, result.id);
    }
    async update(userId, id, dto) {
        const current = await this.getOrFail(userId, id);
        const fields = {};
        if (dto.receiverName !== undefined)
            fields.receiverName = dto.receiverName;
        if (dto.receiverPhone !== undefined)
            fields.receiverPhone = dto.receiverPhone;
        if (dto.provinceId !== undefined)
            fields.provinceId = dto.provinceId;
        if (dto.wardId !== undefined)
            fields.wardId = dto.wardId;
        if (dto.detail !== undefined)
            fields.detail = dto.detail;
        if (fields.provinceId !== undefined || fields.wardId !== undefined) {
            await this.assertLocation(fields.provinceId ?? current.provinceId, fields.wardId ?? current.wardId);
        }
        await this.addresses.update(userId, id, fields, dto.isDefault === true);
        return this.getOrFail(userId, id);
    }
    async setDefault(userId, id) {
        await this.getOrFail(userId, id);
        await this.addresses.makeDefault(userId, id);
        return this.getOrFail(userId, id);
    }
    async remove(userId, id) {
        if (!(await this.addresses.remove(userId, id)))
            throw this.notFound();
    }
    async assertLocation(provinceId, wardId) {
        if (!(await this.addresses.wardBelongsToProvince(wardId, provinceId))) {
            throw new BusinessException(ErrorCode.INVALID_LOCATION, 'Xã/phường không thuộc tỉnh/thành đã chọn hoặc không tồn tại', HttpStatus.BAD_REQUEST, undefined, [{ field: 'wardId', message: 'Xã/phường không thuộc tỉnh/thành đã chọn' }]);
        }
    }
    async getOrFail(userId, id) {
        const address = await this.addresses.findOne(userId, id);
        if (!address)
            throw this.notFound();
        return address;
    }
    notFound() {
        return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy địa chỉ', HttpStatus.NOT_FOUND);
    }
};
AddressService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AddressRepository])
], AddressService);
export { AddressService };
//# sourceMappingURL=address.service.js.map