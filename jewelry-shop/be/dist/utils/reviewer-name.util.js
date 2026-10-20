const FALLBACK_NAME = 'Khách hàng';
const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });
function firstGrapheme(word) {
    for (const part of segmenter.segment(word))
        return part.segment;
    return '';
}
export function maskReviewerName(fullName) {
    const words = (fullName ?? '').normalize('NFC').trim().split(/\s+/u).filter(Boolean);
    if (!words.length)
        return FALLBACK_NAME;
    if (words.length === 1)
        return `${firstGrapheme(words[0])}***`;
    const initials = words.slice(1).map((word) => `${firstGrapheme(word).toLocaleUpperCase('vi')}.`);
    return [words[0], ...initials].join(' ');
}
//# sourceMappingURL=reviewer-name.util.js.map