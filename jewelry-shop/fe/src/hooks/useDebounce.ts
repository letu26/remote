import { useEffect, useState } from "react";

/** Trả về giá trị sau khi người dùng ngừng thay đổi đủ `delay` ms (mặc định 500ms theo quy ước). */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
