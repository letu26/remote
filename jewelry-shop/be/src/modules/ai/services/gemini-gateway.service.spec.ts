import type { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeminiGateway, toPlainText } from './gemini-gateway.service.js';

const gateway = (env: Record<string, string>) => new GeminiGateway({ get: (key: string) => env[key] } as ConfigService);
const reply = (body: unknown, status = 200) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
const ok = (text: string, finishReason = 'STOP') => ({ candidates: [{ content: { parts: [{ text }] }, finishReason }] });

afterEach(() => vi.unstubAllGlobals());

describe('GeminiGateway', () => {
  it('chưa có khóa thì trả null và không gọi mạng', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await gateway({ GEMINI_API_KEY: '  ' }).generate('chatbot', 's', [{ role: 'user', text: 'a' }])).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('gửi khóa qua header, không nằm trong URL', async () => {
    const fetchMock = reply(ok('Chào **bạn**'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await gateway({ GEMINI_API_KEY: 'k-123' }).generate('chatbot', 's', [{ role: 'user', text: 'a' }])).toBe('Chào bạn');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).not.toContain('k-123');
    expect(init.headers['x-goog-api-key']).toBe('k-123');
  });

  it('mỗi tính năng dùng khóa riêng, thiếu thì dùng khóa chung', async () => {
    const own = gateway({ GEMINI_API_KEY_REVENUE: 'r' });
    expect([own.isConfigured('revenue'), own.isConfigured('chatbot')]).toEqual([true, false]);
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(ok('x'))));
    vi.stubGlobal('fetch', fetchMock);
    const both = gateway({ GEMINI_API_KEY: 'chung', GEMINI_API_KEY_RECOMMEND: 'rieng' });
    await both.generate('recommend', 's', []);
    await both.generate('chatbot', 's', []);
    expect(fetchMock.mock.calls.map(([, init]) => init.headers['x-goog-api-key'])).toEqual(['rieng', 'chung']);
  });

  it('model chính lỗi thì gọi model dự phòng', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(ok('từ dự phòng'))));
    vi.stubGlobal('fetch', fetchMock);
    const env = { GEMINI_API_KEY: 'k', GEMINI_MODEL: 'chinh', GEMINI_FALLBACK_MODEL: 'phu' };
    expect(await gateway(env).generate('chatbot', 's', [])).toBe('từ dự phòng');
    expect(fetchMock.mock.calls.map(([url]) => url.split('/').pop())).toEqual(['chinh:generateContent', 'phu:generateContent']);
  });

  it.each([
    ['hết hạn mức', reply({}, 429)],
    ['bị cắt giữa chừng', reply(ok('nửa câu', 'MAX_TOKENS'))],
    ['bị chặn', reply({ promptFeedback: { blockReason: 'SAFETY' } })],
    ['lỗi mạng', vi.fn().mockRejectedValue(new Error('network'))],
  ])('%s thì trả null', async (_name, fetchMock) => {
    vi.stubGlobal('fetch', fetchMock);
    expect(await gateway({ GEMINI_API_KEY: 'k' }).generate('chatbot', 's', [{ role: 'user', text: 'a' }])).toBeNull();
  });

  it('toPlainText bỏ tiêu đề, in đậm và đổi gạch đầu dòng', () => {
    expect(toPlainText('## Tiêu đề\n* **một**\n* hai')).toBe('Tiêu đề\n- một\n- hai');
  });
});
