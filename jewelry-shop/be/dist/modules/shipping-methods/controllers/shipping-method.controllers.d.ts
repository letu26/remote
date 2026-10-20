import { CreateShippingMethodDto, UpdateShippingMethodDto } from '../dtos/shipping-method.dtos.js';
import { ShippingMethodService } from '../services/shipping-method.service.js';
export declare class ShippingMethodController {
    private readonly service;
    constructor(service: ShippingMethodService);
    list(): Promise<{
        id: number;
        name: string;
        description: string | null;
        fee: number;
    }[]>;
}
export declare class ShippingMethodAdminController {
    private readonly service;
    constructor(service: ShippingMethodService);
    list(): Promise<import("../repositories/shipping-method.repository.js").ShippingMethodRow[]>;
    create(dto: CreateShippingMethodDto): Promise<import("../repositories/shipping-method.repository.js").ShippingMethodRow>;
    update(id: number, dto: UpdateShippingMethodDto): Promise<import("../repositories/shipping-method.repository.js").ShippingMethodRow>;
    remove(id: number): Promise<void>;
}
