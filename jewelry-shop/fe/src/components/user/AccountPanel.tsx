"use client";

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
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-paper p-5 shadow-card sm:p-6">
        <h2 className="mb-5 font-serif text-2xl">Thông tin cá nhân</h2>
        <ProfileForm profile={profile} onUpdated={setProfile} />
      </section>
    </div>
  );
}
