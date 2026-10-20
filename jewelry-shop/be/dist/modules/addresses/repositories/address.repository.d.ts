import { DataSource } from 'typeorm';
export interface AddressView {
    id: number;
    receiverName: string;
    receiverPhone: string;
    provinceId: number;
    provinceName: string;
    wardId: number;
    wardName: string;
    detail: string;
    isDefault: boolean;
}
export interface AddressFields {
    receiverName: string;
    receiverPhone: string;
    provinceId: number;
    wardId: number;
    detail: string;
}
export type CreateAddressResult = {
    ok: true;
    id: number;
} | {
    ok: false;
    reason: 'limit';
};
export declare class AddressRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findAll(userId: number): Promise<AddressView[]>;
    findOne(userId: number, id: number): Promise<AddressView | null>;
    wardBelongsToProvince(wardId: number, provinceId: number): Promise<boolean>;
    create(userId: number, fields: AddressFields, wantDefault: boolean, maxAddresses: number): Promise<CreateAddressResult>;
    update(userId: number, id: number, fields: Partial<AddressFields>, makeDefault: boolean): Promise<void>;
    makeDefault(userId: number, id: number): Promise<void>;
    remove(userId: number, id: number): Promise<boolean>;
    private lockUser;
    private count;
    private setDefault;
}
