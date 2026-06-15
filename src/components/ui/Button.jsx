import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

// ─── BUTTON ──────────────────────────────────────────────────
const sizeMap = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
  xl: 'px-6 py-3 text-base gap-2',
};

const variantMap = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  secondary: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700',
  ghost:     'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  success:   'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm',
  warning:   'bg-amber-500 hover:bg-amber-600 text-white shadow-sm',
  info:      'bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm',
  outline:   'border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
  'danger-outline': 'border border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
};

export const Button = forwardRef(({
  children, variant = 'primary', size = 'md', icon, iconRight,
  loading = false, disabled = false, fullWidth = false,
  className = '', onClick, type = 'button', ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 whitespace-nowrap select-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-slate-900',
        sizeMap[size],
        variantMap[variant],
        (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      ) : icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
});
Button.displayName = 'Button';

// ─── ICON BUTTON ─────────────────────────────────────────────
export const IconButton = forwardRef(({
  icon, variant = 'ghost', size = 'md', className = '', title, ...props
}, ref) => {
  const iconSizeMap = { xs: 'p-1', sm: 'p-1.5', md: 'p-2', lg: 'p-2.5' };
  return (
    <button
      ref={ref}
      title={title}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400',
        iconSizeMap[size],
        variantMap[variant],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
});
IconButton.displayName = 'IconButton';
