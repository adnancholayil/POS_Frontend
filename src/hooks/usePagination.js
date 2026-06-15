import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

export const usePagination = (totalItems = 0, initialPageSize = DEFAULT_PAGE_SIZE) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / pageSize)), [totalItems, pageSize]);

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  const changePageSize = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const offset = (currentPage - 1) * pageSize;

  return {
    currentPage, pageSize, totalPages, offset,
    goToPage, nextPage, prevPage, changePageSize,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    pageRange: { from: offset + 1, to: Math.min(offset + pageSize, totalItems) },
  };
};
