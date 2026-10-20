import { CreateFaqDto, UpdateFaqDto } from '../dtos/faq.dtos.js';
import { FaqService } from '../services/faq.service.js';
export declare class FaqController {
    private readonly service;
    constructor(service: FaqService);
    list(): Promise<{
        id: number;
        question: string;
        answer: string;
    }[]>;
}
export declare class FaqAdminController {
    private readonly service;
    constructor(service: FaqService);
    list(): Promise<import("../repositories/faq.repository.js").FaqRow[]>;
    create(dto: CreateFaqDto): Promise<import("../repositories/faq.repository.js").FaqRow>;
    update(id: number, dto: UpdateFaqDto): Promise<import("../repositories/faq.repository.js").FaqRow>;
    remove(id: number): Promise<void>;
}
