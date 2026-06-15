import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiLoader, FiSmartphone, FiArrowLeft } from 'react-icons/fi';
import { authApi } from '../api/services';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Check the link in your email.');
      return;
    }

    const verify = async () => {
      try {
        const response = await authApi.verifyEmail(token);
        setStatus('success');
        setMessage(response.data?.message || 'Your email has been verified successfully!');
        addToast('Email verified successfully!', 'success');
      } catch (err) {
        setStatus('error');
        setMessage(err?.message || 'Email verification failed. The link may have expired.');
        addToast(err?.message || 'Verification failed.', 'error');
      }
    };

    verify();
  }, [token, addToast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-8 text-center relative overflow-hidden"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
            <FiSmartphone className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Email Verification</h1>
        </div>

        <div className="my-8 flex flex-col items-center justify-center gap-4">
          {status === 'loading' && (
            <>
              <FiLoader className="text-blue-500 text-5xl animate-spin" />
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <FiCheckCircle className="text-emerald-500 text-5xl" />
              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{message}</p>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                You can now log in to your store workspace and start using POS terminal operations.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <FiXCircle className="text-red-500 text-5xl" />
              <p className="text-sm text-red-500 font-semibold">{message}</p>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Please request another verification link or contact customer service for help.
              </p>
            </>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate('/login')}
            variant="primary"
            className="w-full h-11 text-sm font-bold shadow-md rounded-xl"
          >
            Go to Login
          </Button>

          <Link to="/login" className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
            <FiArrowLeft /> Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
