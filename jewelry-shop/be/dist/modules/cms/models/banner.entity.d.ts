import { BaseEntity } from '../../../models/base.entity.js';
export declare class Banner extends BaseEntity {
    title: string;
    imageUrl: string;
    linkUrl: string | null;
    imagePublicId: string | null;
    position: string;
    sortOrder: number;
    isActive: boolean;
}
