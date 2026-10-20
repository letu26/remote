"use client";

import { ButtonLink } from "@/components/ui/Button";
import { ROUTES } from "@/constants";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Field";
import { userService, type Profile } from "@/services/user.service";
import { isApiError } from "@/utils/errors";
import { ProfileForm } from "./ProfileForm";

export function AccountPanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    userService
      .getMe()
      .then((p) => !cancelled && setProfile(p))
      .catch((e) => !cancelled && setError(isApiError(e) ? e.message : "Không tải được thông tin"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!profile) return <Spinner label="Đang tải thông tin..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-line bg-paper p-4 shadow-card sm:p-5">
        <h2 className="mb-5 font-serif text-2xl">Thông tin cá nhân</h2>
        <ProfileForm profile={profile} onUpdated={setProfile} />
      </section>
      <section className="rounded-lg border border-line bg-paper p-4 shadow-card sm:p-5">
        <h2 className="mb-3 font-serif text-2xl">Mật khẩu</h2>
        <p className="mb-5 text-sm text-muted">Nên đổi mật khẩu định kỳ để bảo vệ tài khoản.</p>
        <ButtonLink href={ROUTES.changePassword} variant="secondary">Đổi mật khẩu</ButtonLink>
      </section>
      <section className="rounded-lg border border-line bg-paper p-4 shadow-card sm:p-5 lg:col-span-2">
        <h2 className="mb-4 font-serif text-2xl">Mua sắm của tôi</h2>
        <nav aria-label="Liên kết tài khoản" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Đơn hàng của tôi", note: "Theo dõi và hủy đơn", href: ROUTES.orders },
            { label: "Đánh giá của tôi", note: "Đánh giá sản phẩm đã mua", href: ROUTES.reviews },
            { label: "Giỏ hàng", note: "Xem và chỉnh sửa giỏ hàng", href: ROUTES.cart },
            { label: "Yêu thích", note: "Sản phẩm bạn đã lưu", href: ROUTES.wishlist },
            { label: "Sổ địa chỉ", note: "Địa chỉ nhận hàng", href: ROUTES.addresses },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-ui border border-line p-4 transition-colors hover:border-gold-deep hover:bg-gold-tint">
              <span className="block font-medium text-ink">{l.label}</span>
              <span className="mt-1 block text-xs text-muted">{l.note}</span>
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}
