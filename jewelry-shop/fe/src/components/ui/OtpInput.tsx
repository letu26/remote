"use client";

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { inputClass } from "./Field";
import { OTP_LENGTH, sanitizeOtp } from "@/utils/validators";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  errorId?: string;
}

/** 6 ô nhập OTP: chỉ nhận số, tự nhảy ô, hỗ trợ xóa lùi, mũi tên và dán cả mã. */
export function OtpInput({ value, onChange, disabled, invalid, errorId }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const focus = (i: number) => refs.current[Math.min(Math.max(i, 0), OTP_LENGTH - 1)]?.focus();

  const setDigit = (i: number, raw: string) => {
    const digits = sanitizeOtp(raw);
    if (!digits) return;
    const chars = value.padEnd(OTP_LENGTH, " ").split("");
    // Nhiều số (dán hoặc autofill vào 1 ô): trải từ ô hiện tại.
    for (let k = 0; k < digits.length && i + k < OTP_LENGTH; k++) chars[i + k] = digits[k];
    onChange(chars.join("").replace(/ /g, "").slice(0, OTP_LENGTH));
    focus(i + digits.length);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) onChange(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        focus(i - 1);
      }
    } else if (e.key === "ArrowLeft") focus(i - 1);
    else if (e.key === "ArrowRight") focus(i + 1);
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = sanitizeOtp(e.clipboardData.getData("text"));
    if (!digits) return;
    onChange(digits);
    focus(digits.length);
  };

  return (
    <div role="group" aria-label="Mã OTP gồm 6 chữ số" className="flex justify-between gap-2 sm:gap-3">
      {Array.from({ length: OTP_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={OTP_LENGTH}
          aria-label={`Chữ số thứ ${i + 1}`}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          className={`${inputClass(invalid)} h-12 min-w-0 flex-1 px-0 text-center font-serif text-xl`}
        />
      ))}
    </div>
  );
}
