import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck, FiAlertTriangle, FiInfo, FiX, FiAlertCircle } from 'react-icons/fi';
import { removeToast, selectToasts } from '../../features/ui/uiSlice';
import { cn } from '../../utils/helpers';
import { useEffect } from 'react';

const toastConfig = {
  success: { icon: <FiCheck />, cls: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200', iconCls: 'text-emerald-500' },
  error:   { icon: <FiAlertCircle />, cls: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200', iconCls: 'text-red-500' },
  warning: { icon: <FiAlertTriangle />, cls: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200', iconCls: 'text-amber-500' },
  info:    { icon: <FiInfo />, cls: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200', iconCls: 'text-blue-500' },
};

const Toast = ({ id, message, type = 'info', duration = 3500 }) => {
  const dispatch = useDispatch();
  const cfg = toastConfig[type] || toastConfig.info;

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeToast(id)), duration);
    return () => clearTimeout(t);
  }, [id, duration, dispatch]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium min-w-[260px] max-w-sm',
        cfg.cls
      )}
    >
      <span className={cn('text-lg mt-0.5 shrink-0', cfg.iconCls)}>{cfg.icon}</span>
      <p className="flex-1 leading-snug">{message}</p>
      <button
        onClick={() => dispatch(removeToast(id))}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
      >
        <FiX className="text-base" />
      </button>
    </motion.div>
  );
};

export const ToastContainer = () => {
  const toasts = useSelector(selectToasts);
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast {...t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
