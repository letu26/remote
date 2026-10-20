import { BaseEntity } from '../../../models/base.entity.js';
export declare class Page extends BaseEntity {
    slug: string;
    title: string;
    content: string;
    isActive: boolean;
}
