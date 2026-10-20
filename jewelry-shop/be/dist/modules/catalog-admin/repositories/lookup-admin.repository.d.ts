import { DataSource } from 'typeorm';
export type LookupKind = 'materials' | 'gemstones';
export interface LookupAdminRow {
    id: number;
    name: string;
    isActive: boolean;
    productCount: number;
}
export declare class LookupAdminRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findAll(kind: LookupKind): Promise<LookupAdminRow[]>;
    findById(kind: LookupKind, id: number): Promise<LookupAdminRow | null>;
    insert(kind: LookupKind, name: string, isActive: boolean): Promise<number>;
    update(kind: LookupKind, id: number, data: {
        name?: string;
        isActive?: boolean;
    }): Promise<void>;
    delete(kind: LookupKind, id: number): Promise<void>;
}
