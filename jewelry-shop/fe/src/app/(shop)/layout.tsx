import type { ReactNode } from "react";
import { ShopLayout } from "@/layouts/ShopLayout";

export default function ShopGroupLayout({ children }: { children: ReactNode }) {
  return <ShopLayout>{children}</ShopLayout>;
}
