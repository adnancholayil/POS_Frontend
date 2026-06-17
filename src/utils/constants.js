// ============================================================
// APP CONSTANTS
// ============================================================

export const APP_NAME = 'Galaxy POS';
export const APP_VERSION = '1.0.0';

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALESMAN: 'salesman',
};

export const ROLE_LABELS = {
  admin: 'Admin / Owner',
  manager: 'Manager',
  salesman: 'Salesman',
};

// Repair Statuses
export const REPAIR_STATUS = {
  RECEIVED:          'received',
  DIAGNOSING:        'diagnosing',
  WAITING_APPROVAL:  'waiting_approval',
  WAITING_PARTS:     'waiting_parts',
  REPAIRING:         'repairing',
  TESTING:           'testing',
  READY:             'ready',
  DELIVERED:         'delivered',
  CANCELLED:         'cancelled',
};

export const REPAIR_STATUS_LABELS = {
  received:         'Received',
  diagnosing:       'Diagnosing',
  waiting_approval: 'Waiting For Approval',
  waiting_parts:    'Waiting For Parts',
  repairing:        'Repairing',
  testing:          'Testing',
  ready:            'Ready For Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

export const REPAIR_STATUS_COLORS = {
  received:         'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  diagnosing:       'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  waiting_approval: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  waiting_parts:    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  repairing:        'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  testing:          'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  ready:            'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  delivered:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelled:        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

// Task Priorities
export const TASK_PRIORITY = {
  LOW:    'low',
  NORMAL: 'normal',
  HIGH:   'high',
  URGENT: 'urgent',
};

export const TASK_PRIORITY_COLORS = {
  low:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  normal: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
  high:   'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
};

export const TASK_STATUS = {
  PENDING:     'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
  CANCELLED:   'cancelled',
};

// Payment Methods
export const PAYMENT_METHODS = [
  { value: 'cash',   label: 'Cash' },
  { value: 'card',   label: 'Card' },
  { value: 'upi',    label: 'UPI' },
  { value: 'bank',   label: 'Bank Transfer' },
  { value: 'credit', label: 'Store Credit' },
];

// Product Categories
export const PRODUCT_CATEGORIES = [
  'Mobile Phones',
  'Smartphones',
  'Feature Phones',
  'Laptops',
  'Tablets',
  'Chargers',
  'Fast Chargers',
  'Type-C Cables',
  'Lightning Cables',
  'USB Cables',
  'Headsets',
  'Earphones',
  'Bluetooth Earbuds',
  'Smart Watches',
  'Power Banks',
  'Tempered Glass',
  'Mobile Cases',
  'Laptop Bags',
  'Laptop Accessories',
  'Batteries',
  'Displays',
  'Screens',
  'Camera Modules',
  'Charging Ports',
  'Speakers',
  'Motherboards',
  'Spare Parts',
  'Refurbished Parts',
];

// Device Conditions
export const DEVICE_CONDITIONS = [
  { value: 'excellent', label: 'Excellent (Like New)' },
  { value: 'good',      label: 'Good (Minor Wear)' },
  { value: 'fair',      label: 'Fair (Visible Wear)' },
  { value: 'poor',      label: 'Poor (Heavy Wear)' },
  { value: 'damaged',   label: 'Damaged / For Parts' },
];

// Notification Types
export const NOTIFICATION_TYPES = {
  STOCK_ALERT:    'stock_alert',
  TASK_ALERT:     'task_alert',
  REPAIR_UPDATE:  'repair_update',
  WARRANTY_EXPIRY:'warranty_expiry',
  SYSTEM:         'system',
  SALE:           'sale',
};

export const NOTIFICATION_ICONS = {
  stock_alert:     'FiAlertTriangle',
  task_alert:      'FiCheckSquare',
  repair_update:   'FiTool',
  warranty_expiry: 'FiShield',
  system:          'FiInfo',
  sale:            'FiShoppingCart',
};

// Pagination
export const PAGE_SIZES = [10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;

// Date Formats
export const DATE_FORMAT = 'dd MMM yyyy';
export const DATETIME_FORMAT = 'dd MMM yyyy, hh:mm a';

// GST Rates
export const GST_RATES = [0, 5, 12, 18, 28];

// Report Periods
export const REPORT_PERIODS = [
  { value: 'today',   label: 'Today' },
  { value: 'week',    label: 'This Week' },
  { value: 'month',   label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year',    label: 'This Year' },
  { value: 'custom',  label: 'Custom Range' },
];
