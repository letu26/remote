import { DataSource } from 'typeorm';
export interface ShippingMethodRow {
    id: number;
    name: string;
    description: string | null;
    fee: number;
    isActive: boolean;
}
export declare class ShippingMethodRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findAll(onlyActive: boolean): Promise<ShippingMethodRow[]>;
    findById(id: number): Promise<ShippingMethodRow | null>;
    insert(data: {
        name: string;
        description: string | null;
        fee: number;
        isActive: boolean;
    }): Promise<number>;
    update(id: number, data: {
        name?: string;
        description?: string | null;
        fee?: number;
        isActive?: boolean;
    }): Promise<void>;
    countOrders(id: number): Promise<number>;
    delete(id: number): Promise<void>;
}
