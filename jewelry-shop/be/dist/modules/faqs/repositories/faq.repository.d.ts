import { DataSource } from 'typeorm';
export interface FaqRow {
    id: number;
    question: string;
    answer: string;
    keywords: string | null;
    sortOrder: number;
    isActive: boolean;
}
export interface FaqWrite {
    question?: string;
    answer?: string;
    keywords?: string | null;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class FaqRepository {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    findActive(): Promise<FaqRow[]>;
    findAll(): Promise<FaqRow[]>;
    findById(id: number): Promise<FaqRow | null>;
    insert(data: Required<Pick<FaqWrite, 'question' | 'answer'>> & FaqWrite): Promise<number>;
    update(id: number, data: FaqWrite): Promise<void>;
    delete(id: number): Promise<void>;
}
