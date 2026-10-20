import { BaseEntity } from '../../../models/base.entity.js';
export declare class Category extends BaseEntity {
    name: string;
    slug: string;
    parentId: number | null;
    sortOrder: number;
    isActive: boolean;
}
