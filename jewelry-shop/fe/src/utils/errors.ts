import { ERROR_CODE_FIELD, ERROR_MESSAGES } from "@/constants";
import type { FormErrors } from "./validators";

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: ApiErrorDetail[] = [],
    public retryAfterSeconds?: number,
    public remainingAttempts?: number,
    /** Các trường số bổ sung của một số lỗi (ví dụ `available`, `inCart`). */
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/** Gom lỗi backend thành lỗi theo từng trường + thông báo chung của form. */
export function toFormError(e: unknown): { fields: FormErrors; message: string } {
  if (!isApiError(e)) return { fields: {}, message: ERROR_MESSAGES.UNKNOWN };
  const fields: FormErrors = {};
  for (const d of e.details) if (d.field && !fields[d.field]) fields[d.field] = d.message;
  const codeField = ERROR_CODE_FIELD[e.code];
  if (codeField) fields[codeField] = e.message;
  const hasFields = Object.keys(fields).length > 0;
  return { fields, message: hasFields ? "" : e.message };
}
