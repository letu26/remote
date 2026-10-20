import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { CreateAddressDto, UpdateAddressDto } from '../dtos/address.dtos.js';
import { AddressService } from '../services/address.service.js';
export declare class AddressController {
    private readonly service;
    constructor(service: AddressService);
    list(user: AuthenticatedUser): Promise<import("../repositories/address.repository.js").AddressView[]>;
    create(user: AuthenticatedUser, dto: CreateAddressDto): Promise<import("../repositories/address.repository.js").AddressView>;
    update(user: AuthenticatedUser, id: number, dto: UpdateAddressDto): Promise<import("../repositories/address.repository.js").AddressView>;
    setDefault(user: AuthenticatedUser, id: number): Promise<import("../repositories/address.repository.js").AddressView>;
    remove(user: AuthenticatedUser, id: number): Promise<void>;
}
