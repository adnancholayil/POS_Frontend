import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { cn } from '../../utils/helpers';
import { EmptyState, Spinner } from './Badge';
import { Select } from './Input';
import { PAGE_SIZES } from '../../utils/constants';

// ─── DATA TABLE ───────────────────────────────────────────────
export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyIcon,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
  rowKey = 'id',
  onRowClick,
  stickyHeader = false,
  className = '',
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full min-w-full text-sm">
        <thead className={cn('bg-slate-50 dark:bg-slate-800/60', stickyHeader && 'sticky top-0 z-10')}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key || col.label}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-slate-100 dark:border-slate-700',
                  col.headerClassName
                )}
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {data.map((row, idx) => (
            <tr
              key={row[rowKey] ?? idx}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'bg-white dark:bg-slate-800 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50'
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key || col.label}
                  className={cn('px-4 py-3 text-slate-700 dark:text-slate-300 align-middle', col.className)}
                >
                  {col.render ? col.render(row[col.key], row, idx) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── PAGINATION ───────────────────────────────────────────────
export const Pagination = ({
  currentPage, totalPages, pageSize, totalItems, pageRange,
  onPageChange, onPageSizeChange,
  loading = false,
}) => {
  const pages = [];
  const delta = 2;
  for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
    pages.push(i);
  }
  const showLeftEllipsis  = pages.length > 0 && pages[0] > 2;
  const showRightEllipsis = pages.length > 0 && pages[pages.length - 1] < totalPages - 1;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {totalItems > 0
            ? `Showing ${pageRange?.from}–${pageRange?.to} of ${totalItems}`
            : 'No results'}
        </span>
        {onPageSizeChange && (
          <Select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            options={PAGE_SIZES.map((s) => ({ value: s, label: `${s} / page` }))}
            className="py-1 text-xs w-28"
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <PageBtn onClick={() => onPageChange(1)} disabled={currentPage === 1 || loading} title="First">
            <FiChevronsLeft />
          </PageBtn>
          <PageBtn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1 || loading} title="Previous">
            <FiChevronLeft />
          </PageBtn>

          <PageNumBtn active={currentPage === 1} onClick={() => onPageChange(1)}>1</PageNumBtn>
          {showLeftEllipsis && <span className="px-1 text-slate-400">…</span>}
          {pages.map((p) => (
            <PageNumBtn key={p} active={currentPage === p} onClick={() => onPageChange(p)}>{p}</PageNumBtn>
          ))}
          {showRightEllipsis && <span className="px-1 text-slate-400">…</span>}
          {totalPages > 1 && (
            <PageNumBtn active={currentPage === totalPages} onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </PageNumBtn>
          )}

          <PageBtn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} title="Next">
            <FiChevronRight />
          </PageBtn>
          <PageBtn onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages || loading} title="Last">
            <FiChevronsRight />
          </PageBtn>
        </div>
      )}
    </div>
  );
};

const PageBtn = ({ children, disabled, onClick, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
  >
    {children}
  </button>
);

const PageNumBtn = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors',
      active
        ? 'bg-blue-600 text-white'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
    )}
  >
    {children}
  </button>
);

// ─── TABLE WRAPPER (Card + Table + Pagination) ────────────────
export const TableCard = ({
  title, subtitle, actions, columns, data, loading,
  emptyIcon, emptyTitle, emptyDescription, emptyAction,
  pagination, rowKey, onRowClick, className = '',
}) => (
  <div className={cn('bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden', className)}>
    {(title || actions) && (
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 gap-3 flex-wrap">
        <div>
          {title && <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    )}
    <DataTable
      columns={columns} data={data} loading={loading}
      emptyIcon={emptyIcon} emptyTitle={emptyTitle}
      emptyDescription={emptyDescription} emptyAction={emptyAction}
      rowKey={rowKey} onRowClick={onRowClick}
    />
    {pagination && <Pagination {...pagination} />}
  </div>
);
