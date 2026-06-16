import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  FiSettings, FiShield, FiSave, FiCheck,
  FiPrinter, FiFileText, FiSmartphone, FiSliders,
  FiShoppingCart, FiTruck, FiInfo,
} from 'react-icons/fi';
import { settingsApi } from '../api/services';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';

// ─── Compact Print Type Button ────────────────────────────────────────────────
const PrintTypeCard = ({ value, current, onClick, icon, title }) => {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold cursor-pointer
        ${selected
          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-700'
        }`}
    >
      <span className={`text-sm ${selected ? 'text-violet-500' : 'text-slate-400'}`}>{icon}</span>
      {title}
      {selected && <FiCheck className="ml-1 text-violet-500 text-xs" />}
    </button>
  );
};

const PRINT_OPTIONS = [
  {
    value: 'thermal',
    icon: <FiPrinter />,
    title: 'Thermal Printer',
    badge: '80mm Roll',
    description: 'Compact receipt for thermal POS printers. Fast & paper-saving.',
  },
  {
    value: 'a4',
    icon: <FiFileText />,
    title: 'A4 Paper',
    badge: 'Full Page',
    description: 'Full professional invoice. Best for desk printers and filing.',
  },
  {
    value: 'whatsapp',
    icon: <FiSmartphone />,
    title: 'WhatsApp / Digital',
    badge: 'Online',
    description: 'Share invoice digitally. No printer required.',
  },
];

// ─── Compact Print Section ────────────────────────────────────────────────────
const PrintSection = ({ label, icon, value, onChange }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
    <div className="flex items-center gap-1.5 min-w-[220px]">
      <span className="text-slate-400 text-sm">{icon}</span>
      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}:</span>
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      {PRINT_OPTIONS.map(opt => (
        <PrintTypeCard key={opt.value} {...opt} current={value} onClick={onChange} />
      ))}
    </div>
  </div>
);

// ─── Main Settings Component ───────────────────────────────────────────────────
export const Settings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = React.useState('shop');

  // Separate print type states
  const [salesPrintType, setSalesPrintType] = React.useState('thermal');
  const [purchasePrintType, setPurchasePrintType] = React.useState('thermal');

  const {
    register: registerShop,
    handleSubmit: handleSubmitShop,
    reset: resetShop,
    formState: { errors: errorsShop },
  } = useForm();

  const {
    register: registerSecurity,
    handleSubmit: handleSubmitSecurity,
    reset: resetSecurity,
    formState: { errors: errorsSecurity },
  } = useForm();

  // Load settings
  const { data: shopSettings, isLoading: isLoadingShop } = useQuery({
    queryKey: ['shopSettings'],
    queryFn: () => settingsApi.getShop().then(res => res.data),
  });

  // Populate form + print type cards when data loads
  React.useEffect(() => {
    if (shopSettings) {
      resetShop(shopSettings);
      setSalesPrintType(shopSettings.salesPrintType || shopSettings.printType || 'thermal');
      setPurchasePrintType(shopSettings.purchasePrintType || shopSettings.printType || 'thermal');
    }
  }, [shopSettings, resetShop]);

  // Mutations
  const updateShopMutation = useMutation({
    mutationFn: (data) => settingsApi.updateShop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopSettings'] });
      addToast('Settings saved successfully! ✓', 'success');
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Failed to save settings';
      addToast(msg, 'error');
    },
  });

  const updateSecurityMutation = useMutation({
    mutationFn: (data) => settingsApi.updateSecurity(data),
    onSuccess: () => { addToast('Password changed successfully', 'success'); resetSecurity(); },
    onError: () => addToast('Failed to change password', 'error'),
  });

  const handleSaveShop = (data) => {
    updateShopMutation.mutate({
      ...data,
      salesPrintType,
      purchasePrintType,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <FiSettings className="text-violet-500" /> System Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure shop details, receipt printing modes, tax rates and account security.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1">
        {[
          { id: 'shop', label: 'Shop & Printing', icon: <FiSliders /> },
          { id: 'security', label: 'Account Security', icon: <FiShield /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ══ SHOP & PRINTING TAB ══════════════════════════════════════════════ */}
      {activeTab === 'shop' && (
        <div className="max-w-3xl mx-auto space-y-5">
          {isLoadingShop ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-52 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
              <div className="h-52 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
              <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            </div>
          ) : (
            <form
              onSubmit={handleSubmitShop(handleSaveShop, (errs) => {
                const msg = Object.values(errs)[0]?.message;
                if (msg) addToast(msg, 'error');
              })}
              className="space-y-5"
            >
              {/* ── PRINT TYPES ── compact inline rows ───────────────────── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <FiPrinter className="text-violet-500" />
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Print Settings</h2>
                </div>
                <PrintSection
                  label="Sales Invoice"
                  icon={<FiShoppingCart />}
                  value={salesPrintType}
                  onChange={setSalesPrintType}
                />
                <PrintSection
                  label="Purchase Invoice"
                  icon={<FiTruck />}
                  value={purchasePrintType}
                  onChange={setPurchasePrintType}
                />
              </div>

              {/* ── SHOP DETAILS ─────────────────────────────────────────── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                  Shop / Business Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Registered Business Name"
                    placeholder="e.g. Galaxy Electronics"
                    error={errorsShop.name?.message}
                    required
                    {...registerShop('name', { required: 'Business name is required' })}
                  />
                  <Input
                    label="GSTIN / Tax Number"
                    placeholder="e.g. 09AAAFZ1234F1Z1"
                    {...registerShop('gstin')}
                  />
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
                    {...registerShop('email')}
                  />
                  <Input
                    label="Default GST Rate (%)"
                    type="number"
                    placeholder="e.g. 18"
                    error={errorsShop.defaultTaxRate?.message}
                    required
                    {...registerShop('defaultTaxRate', { required: 'GST rate is required' })}
                  />
                  <Input
                    label="Invoice Prefix"
                    placeholder="e.g. INV"
                    {...registerShop('invoicePrefix')}
                  />
                </div>
                <Textarea
                  label="Business Address"
                  placeholder="e.g. Shop No. 5, Gandhi Market, Mumbai"
                  error={errorsShop.address?.message}
                  required
                  {...registerShop('address', { required: 'Address is required' })}
                />
              </div>

              {/* ── INVOICE TERMS ────────────────────────────────────────── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex items-start gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <FiInfo className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Invoice Terms & Footer
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Printed at the bottom of all receipts</p>
                  </div>
                </div>
                <Textarea
                  rows={4}
                  label="Terms & Conditions"
                  placeholder="e.g. 1. Goods once sold cannot be returned.&#10;2. Warranty as per manufacturer policy."
                  {...registerShop('terms')}
                />
              </div>

              {/* Save */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  className="rounded-xl px-8 py-3 text-sm"
                  loading={updateShopMutation.isPending}
                >
                  <FiSave className="mr-1" /> Save All Settings
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ══ SECURITY TAB ═════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <form
              onSubmit={handleSubmitSecurity(
                (data) => updateSecurityMutation.mutate(data),
                (errs) => { const msg = Object.values(errs)[0]?.message; if (msg) addToast(msg, 'error'); }
              )}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <FiShield className="text-violet-500 text-lg" />
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Change Login Password
                </h2>
              </div>

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
                    minLength: { value: 6, message: 'Minimum 6 characters' },
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
                <Button
                  type="submit"
                  variant="primary"
                  className="rounded-xl px-6"
                  loading={updateSecurityMutation.isPending}
                >
                  <FiSave className="mr-1" /> Change Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
