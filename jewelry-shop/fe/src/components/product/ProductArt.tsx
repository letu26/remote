import { useId } from "react";
import type { MetalSlug, ArtSpec as Art } from "@/types/catalog";

/**
 * Ảnh minh họa vẽ bằng SVG (không dùng ảnh bản quyền, không tải từ internet).
 * Thay bằng <Image> khi có kho ảnh thật; chỉ cần đổi component này.
 */
const METAL: Record<MetalSlug, [string, string]> = {
  vang: ["#f3d98a", "#b88a2a"],
  "vang-trang": ["#f2f4f6", "#aab1ba"],
  "vang-hong": ["#f6cdbb", "#c98b74"],
  bac: ["#eceff2", "#9ea5ae"],
  "bach-kim": ["#f6f8fa", "#b7bec6"],
};
const GEM: Record<Art["gem"], [string, string]> = {
  "kim-cuong": ["#ffffff", "#bfe3f2"],
  ruby: ["#f0607a", "#8e1230"],
  sapphire: ["#6f8fe0", "#1d3a8a"],
  "ngoc-trai": ["#ffffff", "#e6dccd"],
  none: ["#f3d98a", "#b88a2a"],
};
const BG: [string, string][] = [
  ["#fffdf8", "#f1e6c8"],
  ["#fbf3e1", "#ead9ab"],
  ["#f9f1ea", "#e8cfc0"],
  ["#f6f3ec", "#ddd2b9"],
];

export function ProductArt({
  art,
  metal,
  variant = 0,
  label,
  className = "",
}: {
  art: Art;
  metal: MetalSlug;
  variant?: number;
  label: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const [m1, m2] = METAL[metal];
  const [g1, g2] = GEM[art.gem];
  const [b1, b2] = BG[variant % BG.length];
  const zoom = [1, 1.25, 0.9, 1.1][variant % 4];
  const rotate = [0, -6, 4, 0][variant % 4];
  const hasGem = art.gem !== "none";

  const gem = (cx: number, cy: number, r: number) => (
    <g>
      <polygon
        points={`${cx - r},${cy} ${cx - r * 0.55},${cy - r * 0.75} ${cx + r * 0.55},${cy - r * 0.75} ${cx + r},${cy} ${cx},${cy + r * 1.1}`}
        fill={`url(#g${uid})`}
        stroke={g2}
        strokeWidth="1"
      />
      <path
        d={`M${cx - r},${cy} H${cx + r} M${cx - r * 0.55},${cy - r * 0.75} L${cx - r * 0.3},${cy} L${cx},${cy + r * 1.1} L${cx + r * 0.3},${cy} L${cx + r * 0.55},${cy - r * 0.75}`}
        stroke="#fff"
        strokeOpacity="0.6"
        strokeWidth="0.8"
        fill="none"
      />
    </g>
  );
  const pearl = (cx: number, cy: number, r: number) => (
    <circle cx={cx} cy={cy} r={r} fill={`url(#p${uid})`} stroke="#d9cdb8" strokeWidth="0.8" />
  );
  const stone = (cx: number, cy: number, r: number) =>
    art.gem === "ngoc-trai" ? pearl(cx, cy, r) : gem(cx, cy, r);

  let body;
  switch (art.kind) {
    case "ring":
      body = (
        <>
          <circle cx="100" cy="122" r="44" fill="none" stroke={`url(#m${uid})`} strokeWidth="9" />
          <path d="M84 82 L100 70 L116 82 L112 90 H88 Z" fill={`url(#m${uid})`} />
          {hasGem && stone(100, 66, 15)}
        </>
      );
      break;
    case "necklace":
      body = (
        <>
          <path d="M34 50 Q100 170 166 50" fill="none" stroke={`url(#m${uid})`} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1 5" />
          <path d="M34 50 Q100 170 166 50" fill="none" stroke={`url(#m${uid})`} strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="116" r="4" fill={`url(#m${uid})`} />
          {hasGem ? stone(100, 134, 14) : <path d="M100 120 l10 16 -10 16 -10 -16 Z" fill={`url(#m${uid})`} />}
        </>
      );
      break;
    case "earring":
      body = (
        <>
          {[62, 138].map((x) => (
            <g key={x}>
              <path d={`M${x} 40 v22`} stroke={`url(#m${uid})`} strokeWidth="3" strokeLinecap="round" />
              <circle cx={x} cy="70" r="8" fill={`url(#m${uid})`} />
              {hasGem ? stone(x, 108, 17) : <circle cx={x} cy="108" r="14" fill={`url(#m${uid})`} />}
            </g>
          ))}
        </>
      );
      break;
    case "bracelet":
      body = (
        <>
          <ellipse cx="100" cy="106" rx="62" ry="40" fill="none" stroke={`url(#m${uid})`} strokeWidth="9" />
          <ellipse cx="100" cy="106" rx="62" ry="40" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 7" />
          {hasGem && stone(100, 62, 14)}
        </>
      );
      break;
    default:
      body = (
        <g transform="translate(100 100) scale(2.4) translate(-100 -100)">{gem(100, 98, 28)}</g>
      );
  }

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={label}
      className={`h-full w-full ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`b${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={b1} />
          <stop offset="1" stopColor={b2} />
        </linearGradient>
        <linearGradient id={`m${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={m1} />
          <stop offset="0.55" stopColor={m2} />
          <stop offset="1" stopColor={m1} />
        </linearGradient>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={g1} />
          <stop offset="1" stopColor={g2} />
        </linearGradient>
        <radialGradient id={`p${uid}`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e3d6c1" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#b${uid})`} />
      <circle cx="160" cy="36" r="48" fill="#fff" fillOpacity="0.35" />
      <g transform={`translate(100 100) rotate(${rotate}) scale(${zoom}) translate(-100 -100)`}>{body}</g>
    </svg>
  );
}
