const UNIT_MS: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/** Đổi chuỗi thời hạn kiểu JWT ("1d", "12h", "30m", "3600") sang mili giây. */
export function durationToMs(value: string): number {
  const match = /^(\d+)\s*([smhd]?)$/.exec(value.trim());
  if (!match) throw new Error(`Thời hạn không hợp lệ: ${value}`);
  const amount = Number(match[1]);
  return match[2] ? amount * UNIT_MS[match[2]] : amount * 1000;
}
