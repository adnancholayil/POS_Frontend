import React from 'react';
import { cn } from '../../utils/helpers';

// ─── BADGE ────────────────────────────────────────────────────
const badgeVariants = {
  default:  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  primary:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  success:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  warning:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  danger:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  info:     'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  purple:   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  orange:   'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  pink:     'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  indigo:   'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
};

export const Badge = ({ children, variant = 'default', dot = false, className = '' }) => (
  <span className={cn(
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
    badgeVariants[variant] || badgeVariants.default,
    className
  )}>
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
    {children}
  </span>
);

// ─── STATUS BADGE ─────────────────────────────────────────────
import { REPAIR_STATUS_LABELS, REPAIR_STATUS_COLORS } from '../../utils/constants';
export const RepairStatusBadge = ({ status }) => (
  <Badge className={REPAIR_STATUS_COLORS[status] || REPAIR_STATUS_COLORS.received}>
    {REPAIR_STATUS_LABELS[status] || status}
  </Badge>
);

// ─── ROLE BADGE ───────────────────────────────────────────────
const roleVariants = { admin: 'primary', manager: 'purple', salesman: 'info' };
const roleLabels = { admin: 'Admin', manager: 'Manager', salesman: 'Salesman' };
export const RoleBadge = ({ role }) => (
  <Badge variant={roleVariants[role] || 'default'}>{roleLabels[role] || role}</Badge>
);

// ─── PRIORITY BADGE ───────────────────────────────────────────
import { TASK_PRIORITY_COLORS } from '../../utils/constants';
export const PriorityBadge = ({ priority }) => (
  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize', TASK_PRIORITY_COLORS[priority])}>
    {priority}
  </span>
);

// ─── COUNT BADGE ──────────────────────────────────────────────
export const CountBadge = ({ count, variant = 'danger', max = 99 }) => {
  if (!count || count < 1) return null;
  return (
    <span className={cn(
      'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
      badgeVariants[variant]
    )}>
      {count > max ? `${max}+` : count}
    </span>
  );
};

// ─── CARD ─────────────────────────────────────────────────────
export const Card = ({ children, className = '', padding = true, hover = false }) => (
  <div className={cn(
    'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm',
    padding && 'p-5',
    hover && 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
    className
  )}>
    {children}
  </div>
);

// ─── STAT CARD ────────────────────────────────────────────────
export const StatCard = ({ label, value, icon, change, changeType = 'positive', color = 'blue', loading = false }) => {
  const colorMap = {
    blue:   { icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', border: 'border-l-blue-500' },
    green:  { icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-500' },
    orange: { icon: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', border: 'border-l-orange-500' },
    purple: { icon: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', border: 'border-l-purple-500' },
    red:    { icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', border: 'border-l-red-500' },
    cyan:   { icon: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400', border: 'border-l-cyan-500' },
  };
  const c = colorMap[color] || colorMap.blue;
  if (loading) return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-5 shadow-sm border-l-4 border-l-slate-200">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-7 w-20 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
        <div className="skeleton w-11 h-11 rounded-xl" />
      </div>
    </div>
  );
  return (
    <div className={cn('bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-5 shadow-sm border-l-4', c.border)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1 leading-none">{value}</p>
          {change !== undefined && (
            <p className={cn('text-xs mt-1.5 font-medium', changeType === 'positive' ? 'text-emerald-600' : 'text-red-500')}>
              {changeType === 'positive' ? '▲' : '▼'} {change}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0', c.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── DIVIDER ──────────────────────────────────────────────────
export const Divider = ({ label, className = '' }) => (
  <div className={cn('flex items-center gap-3', className)}>
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
    {label && <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{label}</span>}
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
  </div>
);

// ─── AVATAR ───────────────────────────────────────────────────
import { getInitials, getAvatarColor } from '../../utils/helpers';
export const Avatar = ({ name, src, size = 'md', className = '' }) => {
  const sizeMap = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-lg' };
  if (src) return <img src={src} alt={name} className={cn('rounded-full object-cover shrink-0', sizeMap[size], className)} />;
  return (
    <div className={cn('rounded-full flex items-center justify-center text-white font-bold shrink-0', sizeMap[size], getAvatarColor(name), className)}>
      {getInitials(name)}
    </div>
  );
};

// ─── EMPTY STATE ──────────────────────────────────────────────
export const EmptyState = ({ icon, title = 'No data found', description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    {icon && <div className="text-5xl text-slate-300 dark:text-slate-600 mb-4">{icon}</div>}
    <h3 className="text-base font-semibold text-slate-600 dark:text-slate-400 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mb-4">{description}</p>}
    {action}
  </div>
);

// ─── LOADING SPINNER ──────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' }[size];
  return (
    <svg className={cn('animate-spin text-blue-600', s, className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
};

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <Spinner size="lg" />
  </div>
);

// ─── SKELETON ─────────────────────────────────────────────────
export const Skeleton = ({ className = '' }) => (
  <div className={cn('skeleton rounded', className)} />
);

export const SkeletonCard = () => (
  <Card>
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  </Card>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-3 p-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);
