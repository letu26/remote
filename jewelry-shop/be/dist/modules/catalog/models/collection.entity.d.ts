import { BaseEntity } from '../../../models/base.entity.js';
export declare class Collection extends BaseEntity {
    name: string;
    slug: string;
    description: string | null;
    bannerUrl: string | null;
    isActive: boolean;
}
