import { useEffect, useState } from 'react';

/** Giờ hiện tại, cập nhật mỗi `intervalMs`. Dùng cho đếm ngược mà không gọi lại API. */
export const useNow = (intervalMs = 60_000): Date => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};
