import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { withFilter } from '../utils/adminOps';

/**
 * Bộ lọc của trang Admin đọc và ghi trên URL, nên tải lại trang hay mở link giữ đúng bộ lọc.
 * Đổi bộ lọc thì về trang 1 (xem withFilter).
 */
export const useUrlFilters = <T extends { page: number }>(
  read: (search: URLSearchParams) => T,
  write: (filters: T) => string
) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => read(searchParams), [read, searchParams]);

  const update = useCallback(
    (patch: Partial<T>) => {
      setSearchParams(new URLSearchParams(write(withFilter(read(searchParams), patch))), { replace: true });
    },
    [read, write, searchParams, setSearchParams]
  );

  const reset = useCallback(() => setSearchParams(new URLSearchParams(), { replace: true }), [setSearchParams]);

  return { filters, update, reset };
};
