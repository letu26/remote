import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../../../exceptions/index.js';
import { type CreateFaqDto, type UpdateFaqDto, splitKeywords } from '../dtos/faq.dtos.js';
import { type FaqRow, FaqRepository } from '../repositories/faq.repository.js';

/** Lưu từ khóa ở dạng gọn: cắt khoảng trắng, bỏ phần rỗng, nối bằng ", "; rỗng thì null. */
const normalizeKeywords = (raw: string | null | undefined): string | null | undefined =>
  raw === undefined ? undefined : splitKeywords(raw ?? '').join(', ') || null;

@Injectable()
export class FaqService {
  constructor(private readonly faqs: FaqRepository) {}

  async listPublic() {
    const rows = await this.faqs.findActive();
    return rows.map(({ id, question, answer }) => ({ id, question, answer }));
  }

  listAll(): Promise<FaqRow[]> {
    return this.faqs.findAll();
  }

  async create(dto: CreateFaqDto): Promise<FaqRow> {
    const id = await this.faqs.insert({
      question: dto.question,
      answer: dto.answer,
      keywords: normalizeKeywords(dto.keywords),
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    });
    return this.getOrFail(id);
  }

  async update(id: number, dto: UpdateFaqDto): Promise<FaqRow> {
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

  async remove(id: number): Promise<void> {
    await this.getOrFail(id);
    await this.faqs.delete(id);
  }

  private async getOrFail(id: number): Promise<FaqRow> {
    const faq = await this.faqs.findById(id);
    if (!faq) throw new BusinessException(ErrorCode.NOT_FOUND, 'Không tìm thấy câu hỏi', HttpStatus.NOT_FOUND);
    return faq;
  }
}
