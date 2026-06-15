import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  FiSettings, FiShield, FiSave, FiCheck,
  FiMapPin, FiMail, FiPhone, FiInfo, FiSliders
} from 'react-icons/fi';
import { settingsApi } from '../api/services';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';

export const Settings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = React.useState('shop'); // 'shop' | 'security'

  // Forms
  const { register: registerShop, handleSubmit: handleSubmitShop, reset: resetShop, formState: { errors: errorsShop } } = useForm();
  const { register: registerSecurity, handleSubmit: handleSubmitSecurity, reset: resetSecurity, formState: { errors: errorsSecurity } } = useForm();

  // Queries
  const { data: shopSettings, isLoading: isLoadingShop } = useQuery({
    queryKey: ['shopSettings'],
    queryFn: () => settingsApi.getShop().then(res => res.data),
  });

  React.useEffect(() => {
    if (shopSettings) {
      resetShop(shopSettings);
    }
  }, [shopSettings, resetShop]);

  // Mutations
  const updateShopMutation = useMutation({
    mutationFn: (data) => settingsApi.updateShop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopSettings'] });
      addToast('Shop details updated successfully', 'success');
    },
    onError: () => addToast('Failed to save shop details', 'error'),
  });

  const updateSecurityMutation = useMutation({
    mutationFn: (data) => settingsApi.updateSecurity(data),
    onSuccess: () => {
      addToast('Security settings updated successfully', 'success');
      resetSecurity();
    },
    onError: () => addToast('Failed to update passwords', 'error'),
  });

  const handleSaveShop = (data) => {
    updateShopMutation.mutate(data);
  };

  const handleSaveSecurity = (data) => {
    updateSecurityMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure billing metadata, update company tax structures, and change account passwords.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('shop')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-1 flex items-center gap-2 ${
            activeTab === 'shop'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FiSliders /> Shop Metadata details
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-1 flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FiShield /> Account Security
        </button>
      </div>

      {/* SHOP METADATA DETAILS */}
      {activeTab === 'shop' && (
        <div className="max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mx-auto">
          {isLoadingShop ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          ) : (
            <form onSubmit={handleSubmitShop(handleSaveShop)} className="space-y-4">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider border-b pb-3 mb-4">Invoice header details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Registered Business Name"
                  placeholder="e.g. Galaxy Electronics"
                  error={errorsShop.name?.message}
                  required
                  {...registerShop('name', { required: 'Name is required' })}
                />
                <Input
                  label="GSTIN Number (Tax Identifier)"
                  placeholder="e.g. 09AAAFZ1234F1Z1"
                  error={errorsShop.gstin?.message}
                  required
                  {...registerShop('gstin', { required: 'GSTIN is required' })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Phone"
                  placeholder="e.g. 9876543210"
                  error={errorsShop.phone?.message}
                  required
                  {...registerShop('phone', { required: 'Phone is required' })}
                />
                <Input
                  label="Contact Email"
                  placeholder="e.g. contact@store.com"
                  error={errorsShop.email?.message}
                  required
                  {...registerShop('email', { required: 'Email is required' })}
                />
              </div>

              <Textarea
                label="Physical Street Address"
                placeholder="e.g. Room 101, Tech Building, New Delhi"
                error={errorsShop.address?.message}
                required
                {...registerShop('address', { required: 'Address is required' })}
              />

              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider border-b pb-3 pt-4 mb-2">Invoice terms & Disclaimers</h2>
              <p className="text-[10px] text-slate-400 mb-4">This block displays at the footer of customer receipts PDFs.</p>

              <Textarea
                rows={4}
                label="Invoice Terms conditions"
                placeholder="e.g. 1. Goods once sold cannot be returned..."
                {...registerShop('terms')}
              />

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="submit" variant="primary" className="rounded-xl px-6" loading={updateShopMutation.isPending}>
                  <FiSave /> Save configuration
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ACCOUNT SECURITY */}
      {activeTab === 'security' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mx-auto">
          <form onSubmit={handleSubmitSecurity(handleSaveSecurity)} className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider border-b pb-3 mb-4">Update login Password</h2>

            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              error={errorsSecurity.currentPassword?.message}
              required
              {...registerSecurity('currentPassword', { required: 'Current password is required' })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                error={errorsSecurity.newPassword?.message}
                required
                {...registerSecurity('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                error={errorsSecurity.confirmPassword?.message}
                required
                {...registerSecurity('confirmPassword', { required: 'Please confirm password' })}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" variant="primary" className="rounded-xl px-6" loading={updateSecurityMutation.isPending}>
                <FiSave /> Change Password
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default Settings;
