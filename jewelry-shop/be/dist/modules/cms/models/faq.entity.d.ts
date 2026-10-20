import { BaseEntity } from '../../../models/base.entity.js';
export declare class Faq extends BaseEntity {
    question: string;
    answer: string;
    keywords: string | null;
    sortOrder: number;
    isActive: boolean;
}
