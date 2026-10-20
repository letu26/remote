import type { CreateAddressDto, UpdateAddressDto } from '../dtos/address.dtos.js';
import { type AddressView, AddressRepository } from '../repositories/address.repository.js';
export declare const MAX_ADDRESSES = 10;
export declare class AddressService {
    private readonly addresses;
    constructor(addresses: AddressRepository);
    list(userId: number): Promise<AddressView[]>;
    create(userId: number, dto: CreateAddressDto): Promise<AddressView>;
    update(userId: number, id: number, dto: UpdateAddressDto): Promise<AddressView>;
    setDefault(userId: number, id: number): Promise<AddressView>;
    remove(userId: number, id: number): Promise<void>;
    private assertLocation;
    private getOrFail;
    private notFound;
}
