import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import type { CreateAddressDto, UpdateAddressDto } from '../dtos/address.dtos.js';
import { type AddressFields, type AddressView, AddressRepository } from '../repositories/address.repository.js';

export const MAX_ADDRESSES = 10;

@Injectable()
export class AddressService {
  constructor(private readonly addresses: AddressRepository) {}

  list(userId: number): Promise<AddressView[]> {
    return this.addresses.findAll(userId);
  }

  async create(userId: number, dto: CreateAddressDto): Promise<AddressView> {
    await this.assertLocation(dto.provinceId, dto.wardId);
    const result = await this.addresses.create(
      userId,
      {
        receiverName: dto.receiverName,
        receiverPhone: dto.receiverPhone,
        provinceId: dto.provinceId,
        wardId: dto.wardId,
        detail: dto.detail,
      },
      dto.isDefault === true,
      MAX_ADDRESSES,
    );
    if (!result.ok) {
      throw new BusinessException(
        ErrorCode.ADDRESS_LIMIT_EXCEEDED,
        `Mỗi tài khoản chỉ lưu tối đa ${MAX_ADDRESSES} địa chỉ`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.getOrFail(userId, result.id);
  }

  async update(userId: number, id: number, dto: UpdateAddressDto): Promise<AddressView> {
    const current = await this.getOrFail(userId, id);
    const fields: Partial<AddressFields> = {};
    if (dto.receiverName !== undefined) fields.receiverName = dto.receiverName;
    if (dto.receiverPhone !== undefined) fields.receiverPhone = dto.receiverPhone;
    if (dto.provinceId !== undefined) fields.provinceId = dto.provinceId;
    if (dto.wardId !== undefined) fields.wardId = dto.wardId;
    if (dto.detail !== undefined) fields.detail = dto.detail;

    if (fields.provinceId !== undefined || fields.wardId !== undefined) {
      await this.assertLocation(fields.provinceId ?? current.provinceId, fields.wardId ?? current.wardId);
    }
    // isDefault:false bị bỏ qua: muốn chuyển mặc định phải đặt địa chỉ khác làm mặc định.
    await this.addresses.update(userId, id, fields, dto.isDefault === true);
    return this.getOrFail(userId, id);
  }

  async setDefault(userId: number, id: number): Promise<AddressView> {
    await this.getOrFail(userId, id);
    await this.addresses.makeDefault(userId, id);
    return this.getOrFail(userId, id);
  }

  async remove(userId: number, id: number): Promise<void> {
    if (!(await this.addresses.remove(userId, id))) throw this.notFound();
  }

  private async assertLocation(provinceId: number, wardId: number): Promise<void> {
    if (!(await this.addresses.wardBelongsToProvince(wardId, provinceId))) {
      throw new BusinessException(
        ErrorCode.INVALID_LOCATION,
        'Xã/phường không thuộc tỉnh/thành đã chọn hoặc không tồn tại',
        HttpStatus.BAD_REQUEST,
        undefined,
        [{ field: 'wardId', message: 'Xã/phường không thuộc tỉnh/thành đã chọn' }],
      );
    }
  }

  private async getOrFail(userId: number, id: number): Promise<AddressView> {
    const address = await this.addresses.findOne(userId, id);
    if (!address) throw this.notFound();
    return address;
  }

  private notFound(): BusinessException {
    return new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy địa chỉ', HttpStatus.NOT_FOUND);
  }
}
