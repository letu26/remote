"use client";

import { useMemo, useState } from "react";
import type { Granularity, RevenuePoint } from "@/types/admin-stats";
import { formatVND } from "@/utils/format";
import { buildChart, formatCompactVND, formatPeriodFull, formatPeriodLabel } from "./chart-utils";

const W = 720;
const H = 280;

/** Biểu đồ cột doanh thu bằng SVG tự viết: hover/focus hiện chú thích, có bảng số liệu thay thế. */
export function RevenueChart({ points, granularity }: { points: RevenuePoint[]; granularity: Granularity }) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const geo = useMemo(() => buildChart(points, { width: W, height: H }), [points]);
  const labelEvery = Math.max(1, Math.ceil(points.length / 10));
  const activePoint = active !== null ? points[active] : null;
  const summary = `Biểu đồ doanh thu theo ${granularity === "day" ? "ngày" : granularity === "month" ? "tháng" : "năm"}, ${points.length} kỳ`;

  if (geo.empty) {
    return <p className="rounded-ui bg-sand px-4 py-10 text-center text-sm text-muted">Chưa có doanh thu trong khoảng thời gian này.</p>;
  }

  const table = (
    <table className={showTable ? "w-full text-left text-[13px]" : "sr-only"}>
      <caption className={showTable ? "mb-2 text-left text-xs text-muted" : "sr-only"}>Số liệu doanh thu theo kỳ</caption>
      <thead>
        <tr className="border-b border-line text-xs uppercase text-muted">
          <th scope="col" className="py-1.5 pr-3 font-semibold">Kỳ</th>
          <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Số đơn</th>
          <th scope="col" className="py-1.5 text-right font-semibold">Doanh thu</th>
        </tr>
      </thead>
      <tbody>
        {points.map((p) => (
          <tr key={p.period} className="border-b border-line/60">
            <th scope="row" className="py-1.5 pr-3 font-normal">{formatPeriodFull(p.period, granularity)}</th>
            <td className="py-1.5 pr-3 text-right">{p.orders}</td>
            <td className="py-1.5 text-right">{formatVND(p.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="space-y-2">
      <p className="min-h-5 text-sm text-ink" aria-live="polite" data-testid="chart-tooltip">
        {activePoint ? (
          <>
            <strong>{formatPeriodFull(activePoint.period, granularity)}</strong>: {activePoint.orders} đơn, {formatVND(activePoint.revenue)}
          </>
        ) : (
          <span className="text-muted">Rê chuột hoặc dùng phím Tab để xem số liệu từng kỳ.</span>
        )}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={summary} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        {geo.ticks.map((t) => (
          <g key={t.value}>
            <line x1={geo.plot.left} x2={geo.plot.right} y1={t.y} y2={t.y} stroke="var(--line)" strokeWidth={1} />
            <text x={geo.plot.left - 6} y={t.y + 4} textAnchor="end" fontSize={11} fill="var(--muted)">
              {formatCompactVND(t.value)}
            </text>
          </g>
        ))}
        {geo.bars.map((b, i) => (
          <g key={b.point.period}>
            <rect
              x={b.x}
              y={b.y}
              width={b.width}
              height={b.height}
              rx={2}
              fill={active === i ? "var(--gold-deeper)" : "var(--gold-deep)"}
              tabIndex={0}
              role="img"
              aria-label={`${formatPeriodFull(b.point.period, granularity)}: ${b.point.orders} đơn, ${formatVND(b.point.revenue)}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="outline-none focus:stroke-ink focus:stroke-2"
            />
            {i % labelEvery === 0 && (
              <text x={b.x + b.width / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
                {formatPeriodLabel(b.point.period, granularity)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <button type="button" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable} className="text-xs text-gold-deep hover:underline">
        {showTable ? "Ẩn bảng số liệu" : "Xem bảng số liệu"}
      </button>
      {showTable ? <div className="max-h-72 overflow-auto">{table}</div> : table}
    </div>
  );
}
