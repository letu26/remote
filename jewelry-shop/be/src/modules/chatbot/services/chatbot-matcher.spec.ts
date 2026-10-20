import { describe, expect, it } from 'vitest';
import {
  containsPhrase,
  normalizeText,
  parseKeywords,
  pickBestMatch,
  rankFaqs,
  scoreFaq,
  type FaqCandidate,
} from './chatbot-matcher.js';

const faq = (id: number, question: string, keywords: string | null, sortOrder = 0): FaqCandidate => ({
  id,
  question,
  keywords,
  sortOrder,
});

describe('normalizeText', () => {
  it('bỏ dấu tiếng Việt, đ -> d, chữ thường, bỏ dấu câu, gộp khoảng trắng', () => {
    expect(normalizeText('  Đổi   TRẢ, bảo-hành?! ')).toBe('doi tra bao hanh');
    expect(normalizeText('Cửa hàng mở cửa lúc mấy giờ ạ?')).toBe('cua hang mo cua luc may gio a');
    expect(normalizeText('ĐỒNG HỒ')).toBe('dong ho');
  });

  it('xử lý chuỗi ở dạng tổ hợp (NFD) như dựng sẵn và chuỗi rỗng', () => {
    expect(normalizeText('Nhẫn'.normalize('NFD'))).toBe('nhan');
    expect(normalizeText('   ')).toBe('');
  });
});

describe('parseKeywords', () => {
  it('tách theo dấu phẩy, chuẩn hóa, bỏ rỗng và trùng', () => {
    expect(parseKeywords('Bảo hành, bao hanh,  , Đổi trả ,doi tra')).toEqual(['bao hanh', 'doi tra']);
    expect(parseKeywords(null)).toEqual([]);
    expect(parseKeywords('')).toEqual([]);
  });
});

describe('containsPhrase', () => {
  it('khớp theo ranh giới từ, không khớp một phần của từ', () => {
    expect(containsPhrase('cho toi hoi bao hanh nhan', 'bao hanh')).toBe(true);
    expect(containsPhrase('bao hanh', 'bao hanh')).toBe(true);
    expect(containsPhrase('khong bao hanhh', 'bao hanh')).toBe(false);
    expect(containsPhrase('nhan', 'nha')).toBe(false);
    expect(containsPhrase('cau hoi', '')).toBe(false);
  });

  it('cụm nhiều từ phải liền kề và đúng thứ tự', () => {
    expect(containsPhrase('do size nhan', 'size nhan')).toBe(true);
    expect(containsPhrase('size cua nhan', 'size nhan')).toBe(false);
  });
});

describe('scoreFaq', () => {
  it('3 điểm mỗi từ khóa + 1 điểm mỗi từ khác biệt của câu hỏi', () => {
    const f = faq(1, 'Chính sách bảo hành như thế nào?', 'bảo hành, warranty');
    // từ khóa "bao hanh" (+3); từ khác biệt của câu hỏi: chinh, sach, bao, hanh, nhu (the, nao là từ dừng) -> bao, hanh trùng (+2)
    expect(scoreFaq(normalizeText('bảo hành thế nào'), f)).toBe(5);
    expect(scoreFaq(normalizeText('hello'), f)).toBe(0);
  });

  it('từ dừng và từ ngắn hơn 3 ký tự không được tính', () => {
    const f = faq(1, 'Shop có giao hàng không?', null);
    expect(scoreFaq(normalizeText('shop co khong'), f)).toBe(0);
    expect(scoreFaq(normalizeText('giao'), f)).toBe(1);
  });

  it('mỗi từ khác biệt chỉ tính một lần dù lặp lại', () => {
    const f = faq(1, 'Giao giao hàng', null);
    expect(scoreFaq(normalizeText('giao giao giao'), f)).toBe(1);
  });
});

describe('rankFaqs & pickBestMatch', () => {
  const faqs = [
    faq(1, 'Giờ mở cửa?', 'giờ mở cửa, mấy giờ', 2),
    faq(2, 'Chính sách bảo hành?', 'bảo hành', 1),
    faq(3, 'Đổi trả thế nào?', 'đổi trả, hoàn tiền', 0),
  ];

  it('chọn FAQ điểm cao nhất', () => {
    const ranked = rankFaqs('Cho mình hỏi bảo hành bao lâu?', faqs);
    expect(ranked[0].faq.id).toBe(2);
    expect(pickBestMatch(ranked)?.faq.id).toBe(2);
  });

  it('hòa điểm thì sortOrder nhỏ hơn thắng, rồi id nhỏ hơn', () => {
    const tie = [faq(5, 'Câu A', 'xin chào', 1), faq(4, 'Câu B', 'xin chào', 1), faq(9, 'Câu C', 'xin chào', 0)];
    expect(rankFaqs('xin chào', tie).map((x) => x.faq.id)).toEqual([9, 4, 5]);
  });

  it('dưới ngưỡng 3 điểm là fallback', () => {
    expect(pickBestMatch(rankFaqs('hôm nay trời đẹp', faqs))).toBeNull();
    // chỉ trùng 1-2 từ khác biệt của câu hỏi, không có từ khóa: < 3 điểm
    expect(pickBestMatch(rankFaqs('chính sách', faqs))).toBeNull();
    expect(pickBestMatch(rankFaqs('xin chào', []))).toBeNull();
  });

  it('khớp đúng ngưỡng 3 điểm (một từ khóa)', () => {
    expect(pickBestMatch(rankFaqs('hoàn tiền', faqs))?.faq.id).toBe(3);
  });

  it('từ khóa nhiều từ khớp theo ranh giới từ', () => {
    expect(pickBestMatch(rankFaqs('mấy giờ mở', faqs))?.faq.id).toBe(1);
    expect(pickBestMatch(rankFaqs('mấygiờ', faqs))).toBeNull();
  });
});
