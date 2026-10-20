import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...props,
  };
}

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const CartIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 4h2.2l2 11h10.5l2-8H6.3" /><circle cx="9" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>
);
export const UserIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7" /></svg>
);
export const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" />
  </svg>
);
export const MenuIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const ChevronIcon = ({ dir = "right", ...p }: IconProps & { dir?: "left" | "right" | "down" | "up" }) => {
  const rotate = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return (
    <svg {...base(p)} style={{ transform: `rotate(${rotate}deg)` }}><path d="m9 6 6 6-6 6" /></svg>
  );
};
export const StarIcon = ({ filled = true, ...p }: IconProps & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "currentColor" : "none"} strokeWidth={1.2}>
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8Z" />
  </svg>
);
export const ChatIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 5h16v11H9l-5 4Z" /><path d="M8.5 10h7M8.5 13h4" /></svg>
);
export const PhoneIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
);
export const ShieldIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6Z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>
);
export const RefreshIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M20 11a8 8 0 0 0-14-4.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.5L20 15M20 20v-5h-5" /></svg>
);
export const TruckIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></svg>
);
export const FilterIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
);
export const AlertIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3 2.5 20h19Z" /><path d="M12 10v4.5M12 17.5v.1" /></svg>
);
export const BoxIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m3 7.5 9-4.5 9 4.5v9L12 21l-9-4.5Z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></svg>
);
export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
