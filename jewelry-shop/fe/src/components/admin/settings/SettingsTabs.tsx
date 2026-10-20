"use client";

import { useState } from "react";
import { BankTransferForm } from "./BankTransferForm";
import { SiteInfoForm } from "./SiteInfoForm";

const TABS = [
  { id: "site", label: "Thông tin cửa hàng" },
  { id: "bank", label: "Chuyển khoản" },
] as const;

export function SettingsTabs() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("site");
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Nhóm cài đặt" className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.id ? "border-gold-deep text-gold-deeper" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tab === "site" ? <SiteInfoForm /> : <BankTransferForm />}</div>
    </div>
  );
}
