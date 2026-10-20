var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { splitKeywords } from '../dtos/faq.dtos.js';
import { FaqRepository } from '../repositories/faq.repository.js';
const normalizeKeywords = (raw) => raw === undefined ? undefined : splitKeywords(raw ?? '').join(', ') || null;
let FaqService = class FaqService {
    faqs;
    constructor(faqs) {
        this.faqs = faqs;
    }
    async listPublic() {
        const rows = await this.faqs.findActive();
        return rows.map(({ id, question, answer }) => ({ id, question, answer }));
    }
    listAll() {
        return this.faqs.findAll();
    }
    async create(dto) {
        const id = await this.faqs.insert({
            question: dto.question,
            answer: dto.answer,
            keywords: normalizeKeywords(dto.keywords),
            sortOrder: dto.sortOrder,
            isActive: dto.isActive,
        });
        return this.getOrFail(id);
    }
    async update(id, dto) {
        await this.getOrFail(id);
        await this.faqs.update(id, {
            question: dto.question,
            answer: dto.answer,
            keywords: normalizeKeywords(dto.keywords),
            sortOrder: dto.sortOrder,
            isActive: dto.isActive,
        });
        return this.getOrFail(id);
    }
    async remove(id) {
        await this.getOrFail(id);
        await this.faqs.delete(id);
    }
    async getOrFail(id) {
        const faq = await this.faqs.findById(id);
        if (!faq)
            throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy câu hỏi', HttpStatus.NOT_FOUND);
        return faq;
    }
};
FaqService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [FaqRepository])
], FaqService);
export { FaqService };
//# sourceMappingURL=faq.service.js.map