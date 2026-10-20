import { type CreateFaqDto, type UpdateFaqDto } from '../dtos/faq.dtos.js';
import { type FaqRow, FaqRepository } from '../repositories/faq.repository.js';
export declare class FaqService {
    private readonly faqs;
    constructor(faqs: FaqRepository);
    listPublic(): Promise<{
        id: number;
        question: string;
        answer: string;
    }[]>;
    listAll(): Promise<FaqRow[]>;
    create(dto: CreateFaqDto): Promise<FaqRow>;
    update(id: number, dto: UpdateFaqDto): Promise<FaqRow>;
    remove(id: number): Promise<void>;
    private getOrFail;
}
