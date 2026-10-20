import { DataSource } from 'typeorm';
export interface MenuRow {
    id: number;
    label: string;
    url: string;
    parentId: number | null;
    placement: 'header' | 'footer';
    sortOrder: number;
    isActive: boolean;
}
export interface MenuWrite {
    label?: string;
    url?: string;
    parentId?: number | null;
    placement?: 'header' | 'footer';
    sortOrder?: number;
    isActive?: boolean;
}
export interface MenuTransaction {
    lock(id: number): Promise<MenuRow | null>;
    countChildren(id: number): Promise<number>;
    insert(data: Required<Pick<MenuWrite, 'label' | 'url' | 'placement'>> & MenuWrite): Promise<number>;
    update(id: number, data: MenuWrite): Promise<void>;
    setChildrenPlacement(parentId: number, placement: 'header' | 'footer'): Promise<void>;
}
export declare class MenuRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findActiveByPlacement(placement: string): Promise<MenuRow[]>;
    findAll(): Promise<MenuRow[]>;
    findById(id: number): Promise<MenuRow | null>;
    runInTransaction<T>(work: (tx: MenuTransaction) => Promise<T>): Promise<T>;
    countChildren(id: number): Promise<number>;
    delete(id: number): Promise<void>;
    private createTransaction;
}
