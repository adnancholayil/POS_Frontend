import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSmartphone, FiShield, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { authApi } from '../api/services';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';

export const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  
  const email = location.state?.email || '';
  const phone = location.state?.phone || '';

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyOtp = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        email: data.email || email,
        otp: data.otp,
      };
      
      const response = await authApi.verifyOtp(payload);
      addToast(response.data?.message || 'OTP verified successfully!', 'success');
      
      // Verification complete, let user login
      navigate('/login');
    } catch (err) {
      const errMsg = err?.message || 'OTP verification failed. Please try again.';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const response = await authApi.resendOtp({ email });
      addToast(response.data?.message || 'OTP resent successfully.', 'success');
      setResendCooldown(30);
    } catch (err) {
      addToast(err?.message || 'Failed to resend OTP.', 'error');
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
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Enter OTP Code</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center leading-relaxed">
            We sent a verification code to your {phone ? `phone number ending in ${phone.slice(-4)}` : 'email address'}.
          </p>
        </div>

        <form onSubmit={handleSubmit(handleVerifyOtp, (errors) => {
          const firstError = Object.values(errors)[0];
          if (firstError?.message) addToast(firstError.message, 'error');
        })} className="space-y-4">
          {!email && (
            <Input
              label="Confirm Email Address"
              type="email"
              placeholder="owner@store.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email confirmation is required',
                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
              })}
            />
          )}

          <Input
            label="Verification OTP Code"
            type="text"
            placeholder="e.g. 123456"
            error={errors.otp?.message}
            icon={<FiShield />}
            {...register('otp', {
              required: 'OTP code is required',
              minLength: { value: 4, message: 'OTP must be at least 4 digits' }
            })}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full h-11 text-sm font-bold shadow-md rounded-xl mt-2"
            loading={isSubmitting}
          >
            Verify & Continue
          </Button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={handleResendOtp}
            disabled={resendCooldown > 0}
            className={`text-xs inline-flex items-center gap-1.5 font-bold transition-colors ${resendCooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 dark:text-blue-400 hover:underline'}`}
          >
            <FiRefreshCw className={resendCooldown > 0 ? '' : 'animate-spin-slow'} />
            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend Verification Code'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOtp;
