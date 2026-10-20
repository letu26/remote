import { BaseEntity } from '../../../models/base.entity.js';
export declare class Menu extends BaseEntity {
    label: string;
    url: string;
    parentId: number | null;
    sortOrder: number;
    placement: 'header' | 'footer';
    isActive: boolean;
}
