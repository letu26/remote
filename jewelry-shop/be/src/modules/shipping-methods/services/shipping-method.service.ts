import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { isForeignKeyReferencedError } from '../../../utils/db-error.util.js';
import type { CreateShippingMethodDto, UpdateShippingMethodDto } from '../dtos/shipping-method.dtos.js';
import { type ShippingMethodRow, ShippingMethodRepository } from '../repositories/shipping-method.repository.js';

@Injectable()
export class ShippingMethodService {
  constructor(private readonly methods: ShippingMethodRepository) {}

  async listPublic() {
    const rows = await this.methods.findAll(true);
    return rows.map(({ id, name, description, fee }) => ({ id, name, description, fee }));
  }

  listAll(): Promise<ShippingMethodRow[]> {
    return this.methods.findAll(false);
  }

  async create(dto: CreateShippingMethodDto): Promise<ShippingMethodRow> {
    const id = await this.methods.insert({
      name: dto.name,
      description: dto.description ?? null,
      fee: dto.fee,
      isActive: dto.isActive ?? true,
    });
    return this.getOrFail(id);
  }

  async update(id: number, dto: UpdateShippingMethodDto): Promise<ShippingMethodRow> {
    await this.getOrFail(id);
    await this.methods.update(id, dto);
    return this.getOrFail(id);
  }

  async remove(id: number): Promise<void> {
    await this.getOrFail(id);
    const orders = await this.methods.countOrders(id);
    if (orders > 0) throw this.inUse(orders);
    try {
      await this.methods.delete(id);
    } catch (error) {
      if (isForeignKeyReferencedError(error)) throw this.inUse(1);
      throw error;
    }
  }

  private inUse(orders: number): BusinessException {
    return new BusinessException(
      ErrorCode.RESOURCE_IN_USE,
      `Phương thức vận chuyển đã có ${orders} đơn hàng sử dụng nên không thể xóa. Hãy tắt (isActive=false) thay vì xóa.`,
      HttpStatus.CONFLICT,
    );
  }

  private async getOrFail(id: number): Promise<ShippingMethodRow> {
    const method = await this.methods.findById(id);
    if (!method) {
      throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy phương thức vận chuyển', HttpStatus.NOT_FOUND);
    }
    return method;
  }
}
