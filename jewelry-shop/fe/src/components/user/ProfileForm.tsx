"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { userService, type Profile } from "@/services/user.service";
import { syncProfileName } from "@/store/profile-store";
import { notify } from "@/utils/notify";
import { validateProfile } from "@/utils/validators";

export function ProfileForm({
  profile,
  onUpdated,
}: {
  profile: Profile;
  onUpdated: (p: Profile) => void;
}) {
  const [values, setValues] = useState({
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
  });
  const { errors, submitting, run, clearError } = useFormSubmit();

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    clearError(k);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    };
    const success = await run(validateProfile(data), async () => {
      const updated = await userService.updateMe(data);
      syncProfileName(updated);
      onUpdated(updated);
    });
    if (success) notify("success", "Cập nhật thông tin thành công");
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
      <Field label="Họ và tên" name="fullName" value={values.fullName} onChange={set("fullName")} error={errors.fullName} />
      <Field label="Email" name="email" type="email" value={values.email} onChange={set("email")} error={errors.email} />
      <Field label="Số điện thoại" name="phone" type="tel" inputMode="numeric" value={values.phone} onChange={set("phone")} error={errors.phone} />
      </div>
      <Button type="submit" loading={submitting}>Lưu thay đổi</Button>
    </form>
  );
}
