import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  FiSettings, FiShield, FiSave, FiCheck,
  FiPrinter, FiFileText, FiSmartphone, FiSliders,
  FiShoppingCart, FiTruck, FiInfo, FiLayers,
  FiRefreshCw, FiSun, FiMoon, FiEye, FiPlus, FiTrendingUp, FiTool, FiGrid, FiCheckSquare
} from 'react-icons/fi';
import { settingsApi } from '../api/services';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

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
// ─── Customization Presets ────────────────────────────────────────────────────
const SOLID_PRESETS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Slate', value: '#475569' },
];

const GRADIENT_PRESETS = [
  { name: 'Sunset Glow', from: '#f97316', to: '#ec4899', angle: '135deg', style: 'linear-gradient(135deg, #f97316, #ec4899)' },
  { name: 'Ocean Breeze', from: '#06b6d4', to: '#3b82f6', angle: '135deg', style: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
  { name: 'Emerald Meadow', from: '#10b981', to: '#059669', angle: '135deg', style: 'linear-gradient(135deg, #10b981, #059669)' },
  { name: 'Purple Haze', from: '#6366f1', to: '#a855f7', angle: '135deg', style: 'linear-gradient(135deg, #6366f1, #a855f7)' },
  { name: 'Royal Velvet', from: '#8b5cf6', to: '#ec4899', angle: '135deg', style: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
  { name: 'Electric Gold', from: '#f59e0b', to: '#d97706', angle: '135deg', style: 'linear-gradient(135deg, #f59e0b, #d97706)' },
];

// ─── Main Settings Component ───────────────────────────────────────────────────
export const Settings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { user } = useAuth();
  const isAdmin = (typeof user?.role === 'object' && user?.role !== null ? user?.role?.name : user?.role) === 'admin';

  const [activeTab, setActiveTab] = React.useState('shop');

  // Separate print type states
  const [salesPrintType, setSalesPrintType] = React.useState('thermal');
  const [purchasePrintType, setPurchasePrintType] = React.useState('thermal');
  const [pageAccess, setPageAccess] = React.useState({});

  // Customization States
  const [primaryType, setPrimaryType] = React.useState('solid'); // 'solid' | 'gradient'
  const [primarySolid, setPrimarySolid] = React.useState('#2563eb');
  const [primaryGradient, setPrimaryGradient] = React.useState({ from: '#06b6d4', to: '#3b82f6', angle: '135deg' });

  const [secondaryType, setSecondaryType] = React.useState('solid'); // 'solid' | 'gradient'
  const [secondarySolid, setSecondarySolid] = React.useState('#8b5cf6');
  const [secondaryGradient, setSecondaryGradient] = React.useState({ from: '#8b5cf6', to: '#ec4899', angle: '135deg' });

  const [previewDark, setPreviewDark] = React.useState(false);
  const [mockSales, setMockSales] = React.useState([
    { id: 1, invoiceNo: 'INV-2026-001', customerName: 'Adnan Cholayil', total: 1250, time: '10:15 AM' },
    { id: 2, invoiceNo: 'INV-2026-002', customerName: 'Sarah Jenkins', total: 840, time: '11:30 AM' },
    { id: 3, invoiceNo: 'INV-2026-003', customerName: 'Michael Chang', total: 3100, time: '01:45 PM' },
  ]);
  const [mockRepairs, setMockRepairs] = React.useState([
    { id: 1, device: 'iPhone 15 Pro Screen', status: 'repairing', cost: 249, customer: 'John Doe' },
    { id: 2, device: 'MacBook Air M2 Battery', status: 'ready', cost: 189, customer: 'Alice Smith' },
  ]);

  const handleRandomizePreview = () => {
    const names = ['Adnan Cholayil', 'Sarah Jenkins', 'Michael Chang', 'Alex Mercer', 'Diana Prince', 'Bruce Wayne', 'Clark Kent', 'Tony Stark'];
    const devices = ['iPad Pro Screen', 'iPhone 14 Battery', 'Galaxy S23 Port', 'MacBook Air Keyboard', 'Dell XPS Fan'];
    
    setMockSales([
      { id: 1, invoiceNo: `INV-2026-00${Math.floor(Math.random() * 9) + 4}`, customerName: names[Math.floor(Math.random() * names.length)], total: Math.floor(Math.random() * 3000) + 150, time: '02:15 PM' },
      { id: 2, invoiceNo: `INV-2026-00${Math.floor(Math.random() * 9) + 4}`, customerName: names[Math.floor(Math.random() * names.length)], total: Math.floor(Math.random() * 3000) + 150, time: '03:45 PM' },
      { id: 3, invoiceNo: `INV-2026-00${Math.floor(Math.random() * 9) + 4}`, customerName: names[Math.floor(Math.random() * names.length)], total: Math.floor(Math.random() * 3000) + 150, time: '05:10 PM' },
    ]);
    setMockRepairs([
      { id: 1, device: devices[Math.floor(Math.random() * devices.length)], status: 'repairing', cost: Math.floor(Math.random() * 400) + 50, customer: names[Math.floor(Math.random() * names.length)] },
      { id: 2, device: devices[Math.floor(Math.random() * devices.length)], status: 'ready', cost: Math.floor(Math.random() * 400) + 50, customer: names[Math.floor(Math.random() * names.length)] },
    ]);
  };

  const getStyleVal = (type, solid, gradient) => {
    return type === 'solid' ? solid : `linear-gradient(${gradient.angle}, ${gradient.from}, ${gradient.to})`;
  };

  const primaryStyleVal = getStyleVal(primaryType, primarySolid, primaryGradient);
  const secondaryStyleVal = getStyleVal(secondaryType, secondarySolid, secondaryGradient);

  const primaryStops = primaryType === 'solid' ? { from: primarySolid, to: primarySolid } : { from: primaryGradient.from, to: primaryGradient.to };
  const secondaryStops = secondaryType === 'solid' ? { from: secondarySolid, to: secondarySolid } : { from: secondaryGradient.from, to: secondaryGradient.to };

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

      // Load color customization fields
      if (shopSettings.primaryColorType) setPrimaryType(shopSettings.primaryColorType);
      if (shopSettings.primaryColorSolid) setPrimarySolid(shopSettings.primaryColorSolid);
      if (shopSettings.primaryColorGradient) setPrimaryGradient(shopSettings.primaryColorGradient);

      if (shopSettings.secondaryColorType) setSecondaryType(shopSettings.secondaryColorType);
      if (shopSettings.secondaryColorSolid) setSecondarySolid(shopSettings.secondaryColorSolid);
      if (shopSettings.secondaryColorGradient) setSecondaryGradient(shopSettings.secondaryColorGradient);

      if (shopSettings.pageAccess) setPageAccess(shopSettings.pageAccess);
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
      primaryColorType: primaryType,
      primaryColorSolid: primarySolid,
      primaryColorGradient: primaryGradient,
      secondaryColorType: secondaryType,
      secondaryColorSolid: secondarySolid,
      secondaryColorGradient: secondaryGradient,
      pageAccess: pageAccess || shopSettings?.pageAccess,
    });
  };

  const handleSaveCustomization = () => {
    updateShopMutation.mutate({
      name: shopSettings?.name,
      address: shopSettings?.address,
      phone: shopSettings?.phone,
      email: shopSettings?.email,
      gstin: shopSettings?.gstin,
      defaultTaxRate: shopSettings?.defaultTaxRate,
      printType: shopSettings?.printType,
      salesPrintType: salesPrintType,
      purchasePrintType: purchasePrintType,
      terms: shopSettings?.terms,
      invoicePrefix: shopSettings?.invoicePrefix,
      repairPrefix: shopSettings?.repairPrefix,

      primaryColorType: primaryType,
      primaryColorSolid: primarySolid,
      primaryColorGradient: primaryGradient,
      secondaryColorType: secondaryType,
      secondaryColorSolid: secondarySolid,
      secondaryColorGradient: secondaryGradient,
      pageAccess: pageAccess || shopSettings?.pageAccess,
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
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'shop', label: 'Shop & Printing', icon: <FiSliders /> },
          { id: 'security', label: 'Account Security', icon: <FiShield /> },
          { id: 'customization', label: 'Website Customization', icon: <FiLayers /> },
          ...(isAdmin ? [{ id: 'permissions', label: 'Page Permissions', icon: <FiCheckSquare /> }] : []),
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
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

      {/* ══ CUSTOMIZATION TAB ══════════════════════════════════════════════ */}
      {activeTab === 'customization' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Customizer Controls Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Sandbox Notice Banner */}
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <FiInfo className="text-sm shrink-0" /> Theme Customize Designer
              </div>
              <p className="leading-relaxed">
                Changes in this sandbox are rendered live on the mock dashboard overlay below. To apply your custom colors and gradients globally across the entire website, click the "Save Customization" button below.
              </p>
            </div>

            {/* PRIMARY COLOR SETTINGS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ background: primaryStyleVal }} />
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Primary Color</h2>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPrimaryType('solid')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${primaryType === 'solid' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    Solid
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrimaryType('gradient')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${primaryType === 'gradient' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    Gradient
                  </button>
                </div>
              </div>

              {primaryType === 'solid' ? (
                <div className="space-y-4">
                  {/* Solid Presets */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Color Presets</label>
                    <div className="grid grid-cols-4 gap-2">
                      {SOLID_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setPrimarySolid(preset.value)}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm relative`} style={{ backgroundColor: preset.value }}>
                            {primarySolid === preset.value && (
                              <FiCheck className="text-white text-xs drop-shadow-sm font-black" />
                            )}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate max-w-full">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Solid Picker */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Custom Color</label>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 relative">
                        <input
                          type="color"
                          value={primarySolid}
                          onChange={(e) => setPrimarySolid(e.target.value)}
                          className="absolute inset-0 w-full h-full p-0 border-0 opacity-0 cursor-pointer scale-150"
                        />
                        <div className="w-full h-full" style={{ backgroundColor: primarySolid }} />
                      </div>
                      <input
                        type="text"
                        value={primarySolid.toUpperCase()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.match(/^#[0-9A-F]{0,6}$/i)) {
                            setPrimarySolid(val);
                          }
                        }}
                        placeholder="#HEXCODE"
                        className="form-input font-mono uppercase tracking-wider text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Gradient Presets */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Gradient Presets</label>
                    <div className="grid grid-cols-3 gap-2">
                      {GRADIENT_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setPrimaryGradient({ from: preset.from, to: preset.to, angle: preset.angle })}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
                        >
                          <span className="w-full h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: preset.style }}>
                            {primaryGradient.from === preset.from && primaryGradient.to === preset.to && (
                              <FiCheck className="text-white text-xs drop-shadow-sm font-black" />
                            )}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate max-w-full">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Gradient Controls */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Custom Gradient</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">Start Color</label>
                        <div className="flex gap-1.5 items-center">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 relative">
                            <input
                              type="color"
                              value={primaryGradient.from}
                              onChange={(e) => setPrimaryGradient(prev => ({ ...prev, from: e.target.value }))}
                              className="absolute inset-0 w-full h-full p-0 border-0 opacity-0 cursor-pointer scale-150"
                            />
                            <div className="w-full h-full" style={{ backgroundColor: primaryGradient.from }} />
                          </div>
                          <input
                            type="text"
                            value={primaryGradient.from.toUpperCase()}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.match(/^#[0-9A-F]{0,6}$/i)) {
                                setPrimaryGradient(prev => ({ ...prev, from: val }));
                              }
                            }}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">End Color</label>
                        <div className="flex gap-1.5 items-center">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 relative">
                            <input
                              type="color"
                              value={primaryGradient.to}
                              onChange={(e) => setPrimaryGradient(prev => ({ ...prev, to: e.target.value }))}
                              className="absolute inset-0 w-full h-full p-0 border-0 opacity-0 cursor-pointer scale-150"
                            />
                            <div className="w-full h-full" style={{ backgroundColor: primaryGradient.to }} />
                          </div>
                          <input
                            type="text"
                            value={primaryGradient.to.toUpperCase()}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.match(/^#[0-9A-F]{0,6}$/i)) {
                                setPrimaryGradient(prev => ({ ...prev, to: val }));
                              }
                            }}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">Gradient Angle</label>
                      <select
                        value={primaryGradient.angle}
                        onChange={(e) => setPrimaryGradient(prev => ({ ...prev, angle: e.target.value }))}
                        className="form-input text-xs rounded-xl"
                      >
                        <option value="135deg">Diagonal (135°)</option>
                        <option value="90deg">Vertical (90°)</option>
                        <option value="180deg">Horizontal (180°)</option>
                        <option value="45deg">Reverse Diagonal (45°)</option>
                        <option value="0deg">Upward (0°)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECONDARY COLOR SETTINGS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ background: secondaryStyleVal }} />
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Secondary Color</h2>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSecondaryType('solid')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${secondaryType === 'solid' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    Solid
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecondaryType('gradient')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${secondaryType === 'gradient' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    Gradient
                  </button>
                </div>
              </div>

              {secondaryType === 'solid' ? (
                <div className="space-y-4">
                  {/* Solid Presets */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Color Presets</label>
                    <div className="grid grid-cols-4 gap-2">
                      {SOLID_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setSecondarySolid(preset.value)}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm relative`} style={{ backgroundColor: preset.value }}>
                            {secondarySolid === preset.value && (
                              <FiCheck className="text-white text-xs drop-shadow-sm font-black" />
                            )}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate max-w-full">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Solid Picker */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Custom Color</label>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 relative">
                        <input
                          type="color"
                          value={secondarySolid}
                          onChange={(e) => setSecondarySolid(e.target.value)}
                          className="absolute inset-0 w-full h-full p-0 border-0 opacity-0 cursor-pointer scale-150"
                        />
                        <div className="w-full h-full" style={{ backgroundColor: secondarySolid }} />
                      </div>
                      <input
                        type="text"
                        value={secondarySolid.toUpperCase()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.match(/^#[0-9A-F]{0,6}$/i)) {
                            setSecondarySolid(val);
                          }
                        }}
                        placeholder="#HEXCODE"
                        className="form-input font-mono uppercase tracking-wider text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Gradient Presets */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Gradient Presets</label>
                    <div className="grid grid-cols-3 gap-2">
                      {GRADIENT_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setSecondaryGradient({ from: preset.from, to: preset.to, angle: preset.angle })}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
                        >
                          <span className="w-full h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: preset.style }}>
                            {secondaryGradient.from === preset.from && secondaryGradient.to === preset.to && (
                              <FiCheck className="text-white text-xs drop-shadow-sm font-black" />
                            )}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate max-w-full">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Gradient Controls */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Custom Gradient</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">Start Color</label>
                        <div className="flex gap-1.5 items-center">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 relative">
                            <input
                              type="color"
                              value={secondaryGradient.from}
                              onChange={(e) => setSecondaryGradient(prev => ({ ...prev, from: e.target.value }))}
                              className="absolute inset-0 w-full h-full p-0 border-0 opacity-0 cursor-pointer scale-150"
                            />
                            <div className="w-full h-full" style={{ backgroundColor: secondaryGradient.from }} />
                          </div>
                          <input
                            type="text"
                            value={secondaryGradient.from.toUpperCase()}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.match(/^#[0-9A-F]{0,6}$/i)) {
                                setSecondaryGradient(prev => ({ ...prev, from: val }));
                              }
                            }}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">End Color</label>
                        <div className="flex gap-1.5 items-center">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 relative">
                            <input
                              type="color"
                              value={secondaryGradient.to}
                              onChange={(e) => setSecondaryGradient(prev => ({ ...prev, to: e.target.value }))}
                              className="absolute inset-0 w-full h-full p-0 border-0 opacity-0 cursor-pointer scale-150"
                            />
                            <div className="w-full h-full" style={{ backgroundColor: secondaryGradient.to }} />
                          </div>
                          <input
                            type="text"
                            value={secondaryGradient.to.toUpperCase()}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.match(/^#[0-9A-F]{0,6}$/i)) {
                                setSecondaryGradient(prev => ({ ...prev, to: val }));
                              }
                            }}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 block mb-1">Gradient Angle</label>
                      <select
                        value={secondaryGradient.angle}
                        onChange={(e) => setSecondaryGradient(prev => ({ ...prev, angle: e.target.value }))}
                        className="form-input text-xs rounded-xl"
                      >
                        <option value="135deg">Diagonal (135°)</option>
                        <option value="90deg">Vertical (90°)</option>
                        <option value="180deg">Horizontal (180°)</option>
                        <option value="45deg">Reverse Diagonal (45°)</option>
                        <option value="0deg">Upward (0°)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save Customization Button */}
            <div className="flex justify-end pt-2">
              <Button
                id="save-customization-btn"
                type="button"
                variant="primary"
                onClick={handleSaveCustomization}
                className="rounded-xl px-8 py-3 text-sm w-full font-bold flex items-center justify-center gap-2 cursor-pointer"
                loading={updateShopMutation.isPending}
              >
                <FiSave /> Save Customization
              </Button>
            </div>

          </div>

          {/* Interactive Live Preview Panel */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiEye className="text-violet-500" /> Interactive Mock Dashboard Preview
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRandomizePreview}
                  title="Randomize data metrics"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <FiRefreshCw className="text-xs" /> Update Data
                </button>
                <div className="flex border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDark(false)}
                    className={`p-1 rounded-md transition-all cursor-pointer ${!previewDark ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}
                    title="Light Dashboard Preview"
                  >
                    <FiSun className="text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDark(true)}
                    className={`p-1 rounded-md transition-all cursor-pointer ${previewDark ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}
                    title="Dark Dashboard Preview"
                  >
                    <FiMoon className="text-xs" />
                  </button>
                </div>
              </div>
            </div>

            {/* MOCK FRAME */}
            <div className={`border-2 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${previewDark ? 'bg-[#0f172a] text-[#f1f5f9] border-[#334155]' : 'bg-[#f8fafc] text-[#0f172a] border-[#e2e8f0]'}`}>
              {/* Mock Window Titlebar */}
              <div className={`px-4 py-2 border-b flex items-center justify-between text-[10px] ${previewDark ? 'bg-[#1e293b] border-[#334155] text-slate-400' : 'bg-slate-100 border-[#e2e8f0] text-slate-500'}`}>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <span className="font-semibold select-none">POS Store Console Preview</span>
                <span className="opacity-0">___</span>
              </div>

              {/* Mock Layout */}
              <div className="flex min-h-[440px] text-xs">
                {/* Mock Sidebar */}
                <div className={`w-[90px] border-r flex flex-col p-2 shrink-0 ${previewDark ? 'bg-[#1e293b] border-[#334155] text-slate-400' : 'bg-white border-[#e2e8f0] text-slate-500'}`}>
                  <div className="flex items-center gap-1 mb-4 pb-2 border-b border-dashed border-slate-700/20">
                    <div className="w-4 h-4 rounded flex items-center justify-center text-[9px] text-white font-bold" style={{ background: primaryStyleVal }}>Z</div>
                    <span className="font-black tracking-tight text-[10px] text-slate-800 dark:text-slate-100">Zylox</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-1.5 rounded flex items-center gap-1.5 font-bold" style={{ background: primaryType === 'solid' ? `${primarySolid}15` : `${primaryGradient.from}15`, color: primaryType === 'solid' ? primarySolid : primaryGradient.from }}>
                      <FiGrid className="text-xs" />
                      <span className="text-[9px]">Dashboard</span>
                    </div>
                    {['Sales', 'Products', 'Repairs', 'Staff', 'Settings'].map((item) => (
                      <div key={item} className="p-1.5 rounded flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-[9px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mock Main Dashboard View */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-xs font-black tracking-tight ${previewDark ? 'text-slate-100' : 'text-slate-800'}`}>Dashboard Overview</h4>
                      <p className="text-[8px] text-slate-400">Welcome to your store console.</p>
                    </div>
                    {/* Action buttons with themes applied */}
                    <div className="flex gap-1.5">
                      <button type="button" className="px-2.5 py-1 text-[8px] font-bold rounded shadow-sm hover:opacity-90 active:scale-95 transition-all text-white flex items-center gap-1 cursor-pointer" style={{ background: primaryStyleVal }}>
                        <FiShoppingCart className="text-[9px]" /> POS Billing
                      </button>
                      <button type="button" className="px-2.5 py-1 text-[8px] font-bold rounded shadow-sm hover:opacity-90 active:scale-95 transition-all text-white flex items-center gap-1 cursor-pointer" style={{ background: secondaryStyleVal }}>
                        <FiPlus className="text-[9px]" /> New Ticket
                      </button>
                    </div>
                  </div>

                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Card 1: Revenue (Styled with Primary Color) */}
                    <div className={`p-3 rounded-xl border relative overflow-hidden shadow-sm hover:-translate-y-0.5 transition-transform duration-250 ${previewDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Revenue (Month)</span>
                        <div className="w-5 h-5 rounded flex items-center justify-center text-white" style={{ background: primaryStyleVal }}>
                          <FiTrendingUp className="text-[10px]" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-[13px] font-black ${previewDark ? 'text-slate-100' : 'text-slate-800'}`}>$12,450.00</span>
                        <span className="text-[7px] font-bold text-green-500 bg-green-500/10 px-1 rounded">+12.5%</span>
                      </div>
                    </div>

                    {/* Card 2: Repairs Done (Styled with Secondary Color) */}
                    <div className={`p-3 rounded-xl border relative overflow-hidden shadow-sm hover:-translate-y-0.5 transition-transform duration-250 ${previewDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Repairs Completed</span>
                        <div className="w-5 h-5 rounded flex items-center justify-center text-white" style={{ background: secondaryStyleVal }}>
                          <FiTool className="text-[10px]" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-[13px] font-black ${previewDark ? 'text-slate-100' : 'text-slate-800'}`}>153 Ticket</span>
                        <span className="text-[7px] font-bold text-green-500 bg-green-500/10 px-1 rounded">+4 new</span>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Analytics (SVG chart styled with primary stops) */}
                  <div className={`p-3 rounded-xl border shadow-sm ${previewDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <h5 className={`text-[8px] font-black uppercase tracking-wider mb-2 ${previewDark ? 'text-slate-300' : 'text-slate-600'}`}>Revenue Analytics (Last 7 Days)</h5>
                    <div className="relative h-20 w-full">
                      {/* SVG Line / Area Graph */}
                      <svg viewBox="0 0 300 80" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="primaryGradPreview" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={primaryStops.from} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={primaryStops.to} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="300" y2="20" stroke={previewDark ? '#334155' : '#f1f5f9'} strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="0" y1="40" x2="300" y2="40" stroke={previewDark ? '#334155' : '#f1f5f9'} strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="0" y1="60" x2="300" y2="60" stroke={previewDark ? '#334155' : '#f1f5f9'} strokeWidth="0.5" strokeDasharray="2,2" />
                        
                        {/* Area */}
                        <path
                          d="M0,70 L30,45 L70,55 L110,35 L160,25 L210,50 L260,30 L300,10 L300,80 L0,80 Z"
                          fill="url(#primaryGradPreview)"
                        />
                        
                        {/* Path Line */}
                        <path
                          d="M0,70 L30,45 L70,55 L110,35 L160,25 L210,50 L260,30 L300,10"
                          fill="none"
                          stroke={primaryStops.from}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Interactive glow points */}
                        <circle cx="160" cy="25" r="3" fill={primaryStops.from} stroke="#ffffff" strokeWidth="1" />
                        <circle cx="300" cy="10" r="3" fill={primaryStops.to} stroke="#ffffff" strokeWidth="1" />
                      </svg>
                    </div>
                  </div>

                  {/* Transaction lists */}
                  <div className={`p-3 rounded-xl border shadow-sm ${previewDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-700/15">
                      <span className={`text-[8px] font-black uppercase tracking-wider ${previewDark ? 'text-slate-300' : 'text-slate-600'}`}>Recent Transactions</span>
                      <span className="text-[7px] hover:underline cursor-pointer" style={{ color: primaryType === 'solid' ? primarySolid : primaryGradient.from }}>View History</span>
                    </div>
                    <div className="space-y-2">
                      {mockSales.map((sale) => (
                        <div key={sale.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: primaryType === 'solid' ? `${primarySolid}15` : `${primaryGradient.from}15`, color: primaryType === 'solid' ? primarySolid : primaryGradient.from }}>
                              <FiShoppingCart className="text-[9px]" />
                            </div>
                            <div>
                              <p className={`text-[8px] font-semibold ${previewDark ? 'text-slate-200' : 'text-slate-800'}`}>{sale.invoiceNo}</p>
                              <p className="text-[7px] text-slate-400">{sale.customerName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-[8px] font-bold ${previewDark ? 'text-slate-200' : 'text-slate-800'}`}>${sale.total}.00</p>
                            <p className="text-[6px] text-slate-400">{sale.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PAGE PERMISSIONS TAB ─── */}
      {activeTab === 'permissions' && isAdmin && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
              <FiCheckSquare className="text-violet-500 text-lg" />
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Role-Based Page Access Management
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure which pages are visible and accessible to each user role.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pl-4">System Page</th>
                    <th className="pb-3 text-center">Admin</th>
                    <th className="pb-3 text-center">Manager</th>
                    <th className="pb-3 text-center">Salesman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {[
                    'Dashboard',
                    'Products',
                    'Inventory',
                    'Purchases',
                    'Sales / POS',
                    'Service Center',
                    'Customers',
                    'Second Hand',
                    'Warranty',
                    'Staff',
                    'Tasks',
                    'Reports',
                    'Settings'
                  ].map(page => (
                    <tr key={page} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 pl-4 font-semibold text-xs text-slate-700 dark:text-slate-300">
                        {page}
                      </td>
                      {['admin', 'manager', 'salesman'].map(roleKey => {
                        const isSettingsAdmin = page === 'Settings' && roleKey === 'admin';
                        const checked = pageAccess[page]?.includes(roleKey) || false;
                        
                        return (
                          <td key={roleKey} className="py-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isSettingsAdmin} // Admin settings access cannot be removed
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setPageAccess(prev => {
                                  const currentRoles = prev[page] || [];
                                  const updatedRoles = isChecked
                                    ? [...currentRoles, roleKey]
                                    : currentRoles.filter(r => r !== roleKey);
                                  
                                  return {
                                    ...prev,
                                    [page]: updatedRoles
                                  };
                                });
                              }}
                              className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 focus:ring-2 dark:focus:ring-violet-600 dark:ring-offset-gray-800 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
              <Button
                onClick={() => {
                  updateShopMutation.mutate({
                    ...shopSettings,
                    pageAccess
                  });
                }}
                variant="primary"
                className="rounded-xl px-6"
                loading={updateShopMutation.isPending}
              >
                <FiSave className="mr-1" /> Save Permissions Matrix
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
