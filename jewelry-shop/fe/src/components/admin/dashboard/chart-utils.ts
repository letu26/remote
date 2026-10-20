import type { Granularity, RevenuePoint } from "@/types/admin-stats";

/** Rút gọn tiền: 1.500.000 -> "1,5 tr", 2.000.000.000 -> "2 tỷ", 500.000 -> "500 nghìn". */
export function formatCompactVND(value: number): string {
  const abs = Math.abs(value);
  const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(n);
  if (abs >= 1e9) return `${fmt(value / 1e9)} tỷ`;
  if (abs >= 1e6) return `${fmt(value / 1e6)} tr`;
  if (abs >= 1e3) return `${fmt(value / 1e3)} nghìn`;
  return fmt(value);
}

/** Thang đo "đẹp": trả về giá trị tối đa và các mốc từ 0. Dữ liệu rỗng/0 vẫn cho thang hợp lệ. */
export function niceScale(maxValue: number, tickCount = 4): { max: number; step: number; ticks: number[] } {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i);
    return { max: tickCount, step: 1, ticks };
  }
  const rough = maxValue / tickCount;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / pow;
  const unit = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  const step = unit * pow;
  const max = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step / 1000; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { max, step, ticks };
}

/** "2026-10-17" -> "17/10", "2026-10" -> "10/2026", "2026" -> "2026". */
export function formatPeriodLabel(period: string, granularity: Granularity): string {
  if (granularity === "day") {
    const [, m, d] = period.split("-");
    return `${d}/${m}`;
  }
  if (granularity === "month") {
    const [y, m] = period.split("-");
    return `${m}/${y}`;
  }
  return period;
}

/** Nhãn đầy đủ cho chú thích và bảng. */
export function formatPeriodFull(period: string, granularity: Granularity): string {
  if (granularity === "day") {
    const [y, m, d] = period.split("-");
    return `${d}/${m}/${y}`;
  }
  if (granularity === "month") return `Tháng ${formatPeriodLabel(period, "month")}`;
  return `Năm ${period}`;
}

export interface ChartGeometry {
  empty: boolean;
  max: number;
  ticks: { value: number; y: number }[];
  bars: { x: number; y: number; width: number; height: number; point: RevenuePoint }[];
  plot: { left: number; top: number; right: number; bottom: number };
}

/** Dựng hình học cột; `empty` khi không có kỳ nào hoặc mọi doanh thu bằng 0. */
export function buildChart(
  points: RevenuePoint[],
  size: { width: number; height: number },
  pad = { left: 56, right: 12, top: 12, bottom: 28 },
): ChartGeometry {
  const plot = { left: pad.left, top: pad.top, right: size.width - pad.right, bottom: size.height - pad.bottom };
  const plotW = plot.right - plot.left;
  const plotH = plot.bottom - plot.top;
  const maxRevenue = points.reduce((m, p) => Math.max(m, p.revenue), 0);
  const scale = niceScale(maxRevenue);
  const y = (v: number) => plot.bottom - (v / scale.max) * plotH;
  const slot = points.length > 0 ? plotW / points.length : plotW;
  const barW = Math.max(1, Math.min(slot * 0.7, 48));
  return {
    empty: points.length === 0 || maxRevenue === 0,
    max: scale.max,
    ticks: scale.ticks.map((value) => ({ value, y: y(value) })),
    bars: points.map((point, i) => {
      const top = y(point.revenue);
      return { x: plot.left + slot * i + (slot - barW) / 2, y: top, width: barW, height: Math.max(0, plot.bottom - top), point };
    }),
    plot,
  };
}
