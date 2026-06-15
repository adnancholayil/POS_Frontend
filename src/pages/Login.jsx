import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiSmartphone, FiHash, FiShield, FiUser } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { authApi } from '../api/services';
import { setCredentials, setError, setLoading } from '../features/auth/authSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';

export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savedCode = localStorage.getItem('shopCode');
  const [savedShopCode, setSavedShopCode] = React.useState(savedCode || '');
  React.useEffect(() => {
    if (savedCode) {
      setValue('tenantId', savedCode);
      setSavedShopCode(savedCode);
    }
  }, [setValue]);

  const handleLogin = async (data) => {
    setIsSubmitting(true);
    dispatch(setLoading(true));
    // Show a loading toast if the request takes >5s (backend cold start)
    const delayedToastId = setTimeout(() => {
      addToast('Waking up server, please wait…', 'info');
    }, 5000);
    try {
      const response = await authApi.login(data);
      clearTimeout(delayedToastId);
      // Save shop code locally if remember-me checked
      if (data.rememberShop && data.tenantId) {
        localStorage.setItem('shopCode', data.tenantId.trim().toUpperCase());
      } else {
        localStorage.removeItem('shopCode');
      }

      dispatch(setCredentials(response.data));
      addToast(`Welcome back, ${response.data.user.name}! 🎉`, 'success');
      navigate('/dashboard');
    } catch (err) {
      clearTimeout(delayedToastId);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Invalid email, password or Shop Code';
      dispatch(setError(errMsg));
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  const DEMO_SHOP_CODE = 'DEMO01';

  const fillQuickLogin = (email, password, shopCode) => {
    setValue('email', email);
    setValue('password', password);
    if (shopCode) setValue('tenantId', shopCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-8 relative overflow-hidden"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
            <FiSmartphone className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Galaxy POS</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
            SaaS Mobile &amp; Laptop Retail Shop Management Terminal
          </p>
        </div>

        <form
          onSubmit={handleSubmit(handleLogin, (errs) => {
            const firstError = Object.values(errs)[0];
            if (firstError?.message) addToast(firstError.message, 'error');
          })}
          className="space-y-4"
        >
          {/* Shop Code */}
          <Input
            label="Shop Code"
            type="text"
            placeholder="e.g.  A3BX7K"
            hint="Your 6-character code received on registration"
            error={errors.tenantId?.message}
            icon={<FiHash />}
            {...register('tenantId', { required: 'Shop Code is required' })}
          />
          {savedShopCode && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              📌 Your saved Shop Code: <span className="font-medium">{savedShopCode}</span>
            </p>
          )}

          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            placeholder="name@yourshop.com"
            error={errors.email?.message}
            icon={<FiMail />}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          {/* Password with show/hide toggle */}
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            icon={<FiLock />}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 4, message: 'Password must be at least 4 characters' },
            })}
          />

          {/* Remember Shop Code + Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="rememberShop"
                type="checkbox"
                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 cursor-pointer"
                {...register('rememberShop')}
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">Remember Shop Code</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-11 text-sm font-bold shadow-md rounded-xl"
            loading={isSubmitting}
          >
            Sign In
          </Button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Demo Access
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            type="button"
            onClick={() => fillQuickLogin('admin@zylox.com', 'admin123', DEMO_SHOP_CODE)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200/50 dark:border-slate-800/40"
          >
            <FiShield className="text-xs text-blue-500" /> Admin
          </button>
          <button
            type="button"
            onClick={() => fillQuickLogin('salesman@zylox.com', 'sales123', DEMO_SHOP_CODE)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200/50 dark:border-slate-800/40"
          >
            <FiUser className="text-xs text-indigo-500" /> Salesman
          </button>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400">
          Don&apos;t have a shop account?{' '}
          <Link to="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            Register Shop
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
