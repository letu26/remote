"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toAdminFormError } from "@/components/admin/admin-errors";
import { notify } from "@/utils/notify";
import type { FormErrors } from "@/utils/validators";

type Resolver = Parameters<typeof toAdminFormError>[2];

/** Như useFormSubmit nhưng ánh xạ lỗi 409/details theo từng ô của khu quản trị. */
export function useAdminForm(codeFields: Record<string, string> = {}, resolve?: Resolver) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);
  const codeRef = useRef(codeFields);
  const resolveRef = useRef(resolve);
  useEffect(() => {
    codeRef.current = codeFields;
    resolveRef.current = resolve;
  });

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setErrors({});
  }, []);

  /** Trả về true nếu thành công. Chặn gửi đúp. */
  const submit = useCallback(async (validation: FormErrors, action: () => Promise<void>): Promise<boolean> => {
    if (lock.current) return false;
    setErrors(validation);
    if (Object.keys(validation).length > 0) return false;
    lock.current = true;
    setSubmitting(true);
    try {
      await action();
      return true;
    } catch (e) {
      const { fields, message } = toAdminFormError(e, codeRef.current, resolveRef.current);
      setErrors(fields);
      if (message) notify("error", message);
      else notify("warning", "Vui lòng kiểm tra lại thông tin");
      return false;
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }, []);

  return { errors, submitting, submit, clearError, reset, setErrors };
}
