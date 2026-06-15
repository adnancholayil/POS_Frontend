import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiSmartphone, FiUser, FiBriefcase, FiArrowRight } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { authApi } from '../api/services';
import { setCredentials, setError, setLoading } from '../features/auth/authSlice';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';

export const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const password = watch('password');

  const handleRegister = async (data) => {
    setIsSubmitting(true);
    dispatch(setLoading(true));
    try {
      // Structure the data as expected by authApi.register
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: data.role,
        shopName: data.shopName,
      };
      
      const response = await authApi.register(payload);
      
      // Seed credentials in store if auto-logged in
      if (response.data?.token || response.data?.accessToken) {
        dispatch(setCredentials(response.data));
      }
      
      addToast(response.data?.message || 'Registration successful! Please check your email to verify your account.', 'success');
      
      // Navigate to login page so they can log in once verified
      navigate('/login');
    } catch (err) {
      const errMsg = err?.message || 'Registration failed. Please try again.';
      dispatch(setError(errMsg));
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 transition-colors duration-300">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-8 relative overflow-hidden"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-md">
            <FiSmartphone className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
            Register your store on Galaxy POS SaaS Management Terminal
          </p>
        </div>

        <form onSubmit={handleSubmit(handleRegister, (errors) => {
          const firstError = Object.values(errors)[0];
          if (firstError?.message) addToast(firstError.message, 'error');
        })} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Shop / Business Name"
              type="text"
              placeholder="e.g. Galaxy Mobiles"
              error={errors.shopName?.message}
              icon={<FiBriefcase />}
              {...register('shopName', { required: 'Shop name is required' })}
            />

            <Input
              label="Owner / Contact Name"
              type="text"
              placeholder="e.g. John Doe"
              error={errors.name?.message}
              icon={<FiUser />}
              {...register('name', { required: 'Name is required' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              label="Phone Number"
              type="text"
              placeholder="e.g. 9988776655"
              error={errors.phone?.message}
              icon={<FiSmartphone />}
              {...register('phone', {
                required: 'Phone number is required',
                pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digit number' }
              })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password"
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
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              icon={<FiLock />}
              {...register('confirmPassword', {
                required: 'Confirm password is required',
                validate: value => value === password || 'Passwords do not match'
              })}
            />
          </div>

          <Select
            label="Assigned Role"
            error={errors.role?.message}
            options={[
              { value: 'admin', label: 'Owner / Administrator' },
              { value: 'manager', label: 'Shop Manager' },
              { value: 'salesman', label: 'Sales Representative' }
            ]}
            {...register('role', { required: 'Role selection is required' })}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full h-11 text-sm font-bold shadow-md rounded-xl mt-2"
            loading={isSubmitting}
            iconRight={<FiArrowRight />}
          >
            Create Account
          </Button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400">
          Already have a shop account?{' '}
          <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
