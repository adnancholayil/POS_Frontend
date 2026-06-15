import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertTriangle, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { cn } from '../../utils/helpers';
import { Button } from './Button';

// ─── MODAL ────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
  const sizeMap = {
    sm:   'max-w-sm',
    md:   'max-w-lg',
    lg:   'max-w-2xl',
    xl:   'max-w-4xl',
    full: 'max-w-6xl',
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'relative w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col',
              sizeMap[size], className
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FiX className="text-lg" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── CONFIRM DIALOG ───────────────────────────────────────────
export const ConfirmDialog = ({
  isOpen, onClose, onConfirm, title = 'Confirm Action',
  message = 'Are you sure?', confirmLabel = 'Confirm',
  variant = 'danger', loading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} size="sm">
    <div className="p-6 flex flex-col items-center text-center gap-4">
      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center',
        variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
      )}>
        <FiAlertTriangle className={cn('text-2xl', variant === 'danger' ? 'text-red-500' : 'text-blue-500')} />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      </div>
      <div className="flex gap-3 w-full">
        <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={variant} fullWidth onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </div>
  </Modal>
);

// ─── DRAWER ───────────────────────────────────────────────────
export const Drawer = ({ isOpen, onClose, title, children, side = 'right', width = 'w-80' }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: side === 'right' ? '100%' : '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: side === 'right' ? '100%' : '-100%' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(
            'absolute top-0 bottom-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl',
            side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
            width
          )}
        >
          {title && (
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                <FiX className="text-lg" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
