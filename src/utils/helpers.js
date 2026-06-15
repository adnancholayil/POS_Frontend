// ============================================================
// UTILITY / HELPER FUNCTIONS
// ============================================================

// Currency formatter
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount == null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount));
};

// Short currency (no decimals)
export const formatCurrencyShort = (amount) => {
  if (amount == null || isNaN(amount)) return '₹0';
  const num = Number(amount);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000)   return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000)     return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
};

// Number formatter
export const formatNumber = (n) => {
  if (n == null || isNaN(n)) return '0';
  return new Intl.NumberFormat('en-IN').format(Number(n));
};

// Percentage
export const formatPercent = (value, decimals = 1) => {
  if (value == null || isNaN(value)) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
};

// Date formatter
export const formatDate = (date, options = {}) => {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', ...options,
  });
};

// DateTime formatter
export const formatDateTime = (date) => {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

// Relative time
export const timeAgo = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60)    return `${seconds}s ago`;
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800)return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(d);
};

// Days until date
export const daysUntil = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

// Truncate string
export const truncate = (str, maxLen = 30) => {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
};

// Generate invoice number
export const generateInvoiceNo = (prefix = 'INV') => {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${yy}${mm}-${rand}`;
};

// Generate ticket number
export const generateTicketNo = () => generateInvoiceNo('TKT');

// Calculate GST
export const calculateGst = (amount, rate) => {
  const base = Number(amount) / (1 + rate / 100);
  const gst = Number(amount) - base;
  return { base: +base.toFixed(2), gst: +gst.toFixed(2), total: +Number(amount).toFixed(2) };
};

// Discount calculator
export const applyDiscount = (price, discount, type = 'percent') => {
  const p = Number(price);
  const d = Number(discount);
  if (type === 'percent') return +(p - (p * d) / 100).toFixed(2);
  return +(p - d).toFixed(2);
};

// Class name merger
export const cn = (...classes) => classes.filter(Boolean).join(' ');

// Debounce
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// Capitalize
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Snake to title
export const snakeToTitle = (str) => {
  if (!str) return '';
  return str.split('_').map(capitalize).join(' ');
};

// Get initials
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Random avatar color based on string
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
  'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
];
export const getAvatarColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Deep clone
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// Validate IMEI (15-digit Luhn check)
export const validateImei = (imei) => {
  if (!imei || !/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = parseInt(imei[i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
};

// Sort array of objects
export const sortBy = (arr, key, dir = 'asc') => {
  return [...arr].sort((a, b) => {
    const av = a[key]; const bv = b[key];
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
};

// Group array by key
export const groupBy = (arr, key) => {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
};

// Flatten nested errors from react-hook-form
export const flattenErrors = (errors) => {
  const flat = {};
  const traverse = (obj, prefix = '') => {
    Object.entries(obj).forEach(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v?.message) flat[key] = v.message;
      else if (typeof v === 'object') traverse(v, key);
    });
  };
  traverse(errors);
  return flat;
};

// Download blob
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// Profit color
export const profitColor = (profit) => {
  if (profit > 0) return 'text-green-600 dark:text-green-400';
  if (profit < 0) return 'text-red-600 dark:text-red-400';
  return 'text-slate-500';
};
