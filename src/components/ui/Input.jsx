import React, { forwardRef, useState } from 'react';
import { cn } from '../../utils/helpers';
import { FiEye, FiEyeOff } from 'react-icons/fi';

// ─── INPUT ────────────────────────────────────────────────────
export const Input = forwardRef(({
  label, error, hint, icon, iconRight, size = 'md',
  className = '', containerClass = '', required = false, ...props
}, ref) => {
  const sizeClass = { sm: 'py-1.5 text-xs', md: 'py-2 text-sm', lg: 'py-2.5 text-sm' }[size];
  const isPassword = props.type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : props.type;

  const togglePassword = (e) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  const rightIconElement = isPassword ? (
    <button
      type="button"
      onClick={togglePassword}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer z-10"
    >
      {showPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
    </button>
  ) : iconRight ? (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">{iconRight}</span>
  ) : null;

  return (
    <div className={cn('flex flex-col gap-1', containerClass)}>
      {label && (
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">{icon}</span>
        )}
        <input
          ref={ref}
          type={inputType}
          className={cn(
            'w-full bg-white dark:bg-slate-800 border rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-150',
            'focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
            error ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : 'border-slate-200 dark:border-slate-700',
            icon ? 'pl-9' : 'pl-3',
            isPassword || iconRight ? 'pr-9' : 'pr-3',
            sizeClass,
            className
          )}
          {...props}
        />
        {rightIconElement}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
});
Input.displayName = 'Input';

// ─── TEXTAREA ─────────────────────────────────────────────────
export const Textarea = forwardRef(({
  label, error, hint, rows = 3, className = '', containerClass = '', required = false, ...props
}, ref) => (
  <div className={cn('flex flex-col gap-1', containerClass)}>
    {label && (
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full bg-white dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all duration-150 resize-y',
        'focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
        error ? 'border-red-400' : 'border-slate-200 dark:border-slate-700',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

// ─── SELECT ───────────────────────────────────────────────────
export const Select = forwardRef(({
  label, error, hint, options = [], placeholder, className = '', containerClass = '', required = false, ...props
}, ref) => (
  <div className={cn('flex flex-col gap-1', containerClass)}>
    {label && (
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    <select
      ref={ref}
      className={cn(
        'w-full bg-white dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none transition-all duration-150 cursor-pointer',
        'focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
        error ? 'border-red-400' : 'border-slate-200 dark:border-slate-700',
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) =>
        typeof opt === 'string'
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.value} value={opt.value}>{opt.label}</option>
      )}
    </select>
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
));
Select.displayName = 'Select';

// ─── CHECKBOX ─────────────────────────────────────────────────
export const Checkbox = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <input
      ref={ref}
      type="checkbox"
      className={cn('w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer', className)}
      {...props}
    />
    {label && <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </label>
));
Checkbox.displayName = 'Checkbox';

// ─── SEARCH INPUT ─────────────────────────────────────────────
import { FiSearch, FiX } from 'react-icons/fi';
export const SearchInput = ({ value, onChange, onClear, placeholder = 'Search…', className = '' }) => (
  <div className={cn('relative', className)}>
    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
    />
    {value && (
      <button onClick={onClear} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded">
        <FiX className="text-sm" />
      </button>
    )}
  </div>
);
