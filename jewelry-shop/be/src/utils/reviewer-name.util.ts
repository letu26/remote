const FALLBACK_NAME = 'Khách hàng';
const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });

/** Ký tự (grapheme) đầu tiên, an toàn với chữ có dấu ở dạng tổ hợp lẫn dựng sẵn và ký tự ngoài BMP. */
function firstGrapheme(word: string): string {
  for (const part of segmenter.segment(word)) return part.segment;
  return '';
}

/**
 * Che bớt họ tên khi hiển thị công khai: giữ nguyên từ đầu, các từ sau chỉ lấy chữ cái đầu kèm dấu chấm;
 * tên một từ thì chữ cái đầu + '***'. Ví dụ: "Trần Tiến Dũng" -> "Trần T. D.", "Dũng" -> "D***".
 */
export function maskReviewerName(fullName: string | null | undefined): string {
  const words = (fullName ?? '').normalize('NFC').trim().split(/\s+/u).filter(Boolean);
  if (!words.length) return FALLBACK_NAME;
  if (words.length === 1) return `${firstGrapheme(words[0])}***`;
  const initials = words.slice(1).map((word) => `${firstGrapheme(word).toLocaleUpperCase('vi')}.`);
  return [words[0], ...initials].join(' ');
}
