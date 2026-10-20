import type { CreateShippingMethodDto, UpdateShippingMethodDto } from '../dtos/shipping-method.dtos.js';
import { type ShippingMethodRow, ShippingMethodRepository } from '../repositories/shipping-method.repository.js';
export declare class ShippingMethodService {
    private readonly methods;
    constructor(methods: ShippingMethodRepository);
    listPublic(): Promise<{
        id: number;
        name: string;
        description: string | null;
        fee: number;
    }[]>;
    listAll(): Promise<ShippingMethodRow[]>;
    create(dto: CreateShippingMethodDto): Promise<ShippingMethodRow>;
    update(id: number, dto: UpdateShippingMethodDto): Promise<ShippingMethodRow>;
    remove(id: number): Promise<void>;
    private inUse;
    private getOrFail;
}
