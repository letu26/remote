"use client";

import { useCallback, useEffect, useState } from "react";

type Result<T> = { key: string; data?: T; failed?: boolean };

/**
 * Tải dữ liệu bất đồng bộ theo `depsKey`. Khi `depsKey` đổi, request cũ bị hủy (AbortSignal) và
 * kết quả cũ bị bỏ; `reload()` thử lại. `loading` đúng cho tới khi có kết quả của đúng khóa hiện tại.
 */
export function useAsyncData<T>(depsKey: string, fetcher: (signal: AbortSignal) => Promise<T>) {
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const key = `${depsKey}#${retry}`;

  useEffect(() => {
    const controller = new AbortController();
    fetcher(controller.signal)
      .then((data) => !controller.signal.aborted && setResult({ key, data }))
      .catch(() => !controller.signal.aborted && setResult({ key, failed: true }));
    return () => controller.abort();
    // `fetcher` được tạo lại mỗi lần render; `key` đã đại diện cho đầu vào của nó.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setRetry((r) => r + 1), []);
  const current = result?.key === key ? result : null;
  return {
    data: current?.data,
    failed: !!current?.failed,
    loading: current === null,
    reload,
  };
}
