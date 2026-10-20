"use client";

import { useCallback, useRef, useState } from "react";
import { toFormError } from "@/utils/errors";
import { notify } from "@/utils/notify";
import type { FormErrors } from "@/utils/validators";

/** Quản lý lỗi theo ô (inline) + trạng thái gửi, chặn submit đúp. Lỗi chung đi qua toast. */
export function useFormSubmit() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /** Trả về true nếu thành công. */
  const run = useCallback(
    async (validation: FormErrors, action: () => Promise<void>): Promise<boolean> => {
      if (lock.current) return false;
      setErrors(validation);
      if (Object.keys(validation).length > 0) return false;
      lock.current = true;
      setSubmitting(true);
      try {
        await action();
        return true;
      } catch (e) {
        const { fields, message } = toFormError(e);
        setErrors(fields);
        // Lỗi theo ô nằm inline dưới ô; toast chỉ tóm tắt để khỏi lặp nội dung.
        if (message) notify("error", message);
        else notify("warning", "Vui lòng kiểm tra lại thông tin");
        return false;
      } finally {
        lock.current = false;
        setSubmitting(false);
      }
    },
    [],
  );

  return { errors, submitting, run, clearError };
}
