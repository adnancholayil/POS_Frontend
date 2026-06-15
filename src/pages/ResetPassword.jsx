import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiKey, FiSmartphone, FiArrowLeft } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { authApi } from '../api/services';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      email: location.state?.email || '',
      tenantId: location.state?.tenantId || localStorage.getItem('tenantId') || '',
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const password = watch('password');

  const handleResetPassword = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        email: data.email,
        token: data.token, // reset code / OTP
        password: data.password,
        tenantId: data.tenantId,
      };
      
      const response = await authApi.resetPassword(payload);
      addToast(response.data?.message || 'Password reset successful. Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      const errMsg = err?.message || 'Failed to reset password. Please check your inputs.';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
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
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6 font-bold transition-colors">
          <FiArrowLeft /> Back to Login
        </Link>

        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-md">
            <FiSmartphone className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Reset Password</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
            Enter the OTP code received in email to define a new password.
          </p>
        </div>

        <form onSubmit={handleSubmit(handleResetPassword, (errors) => {
          const firstError = Object.values(errors)[0];
          if (firstError?.message) addToast(firstError.message, 'error');
        })} className="space-y-4">
          <Input
            label="Shop ID / Tenant ID"
            type="text"
            placeholder="Enter Shop ID"
            error={errors.tenantId?.message}
            {...register('tenantId', { required: 'Shop ID is required' })}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="owner@store.com"
            error={errors.email?.message}
            icon={<FiMail />}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
            })}
          />

          <Input
            label="Reset Code (OTP)"
            type="text"
            placeholder="e.g. 123456"
            error={errors.token?.message}
            icon={<FiKey />}
            {...register('token', {
              required: 'OTP reset code is required'
            })}
          />

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            icon={<FiLock />}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' }
            })}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            icon={<FiLock />}
            {...register('confirmPassword', {
              required: 'Confirm password is required',
              validate: value => value === password || 'Passwords do not match'
            })}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full h-11 text-sm font-bold shadow-md rounded-xl mt-2"
            loading={isSubmitting}
          >
            Reset Password
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
