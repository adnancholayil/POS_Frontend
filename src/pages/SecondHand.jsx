import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiRepeat, FiPlusCircle, FiSearch, FiDollarSign,
  FiUser, FiCpu, FiCheck, FiCpu as FiImei, FiBookOpen
} from 'react-icons/fi';
import { secondHandApi } from '../api/services';
import { TableCard } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea, SearchInput } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { DEVICE_CONDITIONS } from '../utils/constants';

export const SecondHand = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'buy'
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    if (location.pathname.endsWith('/buy')) {
      setActiveTab('buy');
    } else {
      setActiveTab('inventory');
    }
  }, [location.pathname]);

  // Modals state
  const [sellingItem, setSellingItem] = useState(null);

  // Forms
  const { register: registerBuy, handleSubmit: handleSubmitBuy, reset: resetBuy, control, setValue: setBuyValue, formState: { errors: errorsBuy } } = useForm({
    defaultValues: { originalPrice: '', condition: 'good' }
  });

  const { register: registerSell, handleSubmit: handleSubmitSell, reset: resetSell } = useForm();

  // Watch values for real-time trade-in valuation
  const watchedPrice = useWatch({ control, name: 'originalPrice' });
  const watchedCondition = useWatch({ control, name: 'condition' });

  // Compute valuation locally or trigger query
  const { data: valuationData } = useQuery({
    queryKey: ['valuation', watchedPrice, watchedCondition],
    queryFn: () => secondHandApi.evaluate({ originalPrice: watchedPrice, condition: watchedCondition }).then(res => res.data),
    enabled: !!watchedPrice && !isNaN(Number(watchedPrice)),
  });

  // Apply estimated value to form buyPrice field
  React.useEffect(() => {
    if (valuationData?.estimatedValue) {
      setBuyValue('buyPrice', valuationData.estimatedValue);
    }
  }, [valuationData, setBuyValue]);

  // Queries
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['secondHandDevices'],
    queryFn: () => secondHandApi.getAll().then(res => res.data),
  });

  // Mutations
  const buyMutation = useMutation({
    mutationFn: (data) => secondHandApi.buyDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secondHandDevices'] });
      addToast('Pre-owned device buy-back logged', 'success');
      resetBuy();
      navigate('/second-hand');
    },
    onError: () => addToast('Failed to log intake', 'error'),
  });

  const sellMutation = useMutation({
    mutationFn: ({ id, sellPrice }) => secondHandApi.sellDevice(id, { sellPrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secondHandDevices'] });
      addToast('Device sold and recorded in sales', 'success');
      setSellingItem(null);
      resetSell();
    },
    onError: () => addToast('Failed to complete sale', 'error'),
  });

  const handleBuy = (data) => {
    buyMutation.mutate({
      ...data,
      originalPrice: Number(data.originalPrice),
      buyPrice: Number(data.buyPrice),
    });
  };

  const handleSell = (data) => {
    sellMutation.mutate({
      id: sellingItem.id,
      sellPrice: Number(data.sellPrice),
    });
  };

  const filteredDevices = devices.filter(d =>
    d.deviceName.toLowerCase().includes(search.toLowerCase()) || d.imei.includes(search)
  );

  const columns = [
    { label: 'Device Name', key: 'deviceName', className: 'font-bold' },
    { label: 'IMEI / Serial', key: 'imei', className: 'font-mono text-xs text-slate-500' },
    { label: 'Condition', key: 'condition', render: (val) => val.toUpperCase(), className: 'text-xs font-bold' },
    { label: 'Buy Price', key: 'buyPrice', render: (val) => formatCurrency(val) },
    {
      label: 'Selling Price',
      key: 'sellPrice',
      render: (val, row) => val ? formatCurrency(val) : <span className="text-slate-400 italic">Not Sold</span>
    },
    {
      label: 'Status',
      key: 'status',
      render: (val) => val === 'available'
        ? <Badge variant="success">Available</Badge>
        : <Badge variant="danger">Sold</Badge>
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          {row.status === 'available' && (
            <button
              onClick={() => setSellingItem(row)}
              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 transition-colors flex items-center gap-1 text-xs font-bold"
              title="Sell Device"
            >
              <FiDollarSign /> Sell
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Second Hand & Trade-Ins</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage pre-owned inventories, evaluate buyback offers, and log retail trade-in transactions.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'buy' ? 'secondary' : 'primary'}
            className="rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm"
            onClick={() => navigate(activeTab === 'inventory' ? '/second-hand/buy' : '/second-hand')}
          >
            {activeTab === 'inventory' ? <><FiPlusCircle /> Device Buy-Back</> : <><FiRepeat /> View Pre-owned Inventory</>}
          </Button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Search by device name, IMEI..."
          />
          <TableCard
            columns={columns}
            data={filteredDevices}
            loading={isLoading}
            emptyTitle="No pre-owned devices found"
          />
        </div>
      ) : (
        /* INTAKE FORM & EVALUATOR */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
          {/* Intake form */}
          <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">Record Pre-Owned Device Purchase</h2>
            <p className="text-[11px] text-slate-400 mb-6">Log trade-ins or direct second hand stock procurements.</p>

            <form onSubmit={handleSubmitBuy(handleBuy)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Device Brand / Make"
                  placeholder="e.g. Apple"
                  error={errorsBuy.brand?.message}
                  required
                  {...registerBuy('brand', { required: 'Brand is required' })}
                />
                <Input
                  label="Device Model Name"
                  placeholder="e.g. iPhone 12 Pro Max"
                  error={errorsBuy.deviceName?.message}
                  required
                  {...registerBuy('deviceName', { required: 'Model name is required' })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Device IMEI / Serial Number"
                  placeholder="Unique identification code"
                  error={errorsBuy.imei?.message}
                  required
                  {...registerBuy('imei', { required: 'IMEI is required' })}
                />
                <Select
                  label="Physical Condition Status"
                  options={DEVICE_CONDITIONS}
                  error={errorsBuy.condition?.message}
                  required
                  {...registerBuy('condition', { required: 'Condition is required' })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 border-slate-100 dark:border-slate-800">
                <Input
                  label="Original Retail Buying Price (₹)"
                  type="number"
                  placeholder="Original retail price"
                  error={errorsBuy.originalPrice?.message}
                  required
                  {...registerBuy('originalPrice', { required: 'Original price is required' })}
                />
                <Input
                  label="Acquisition Buy-Back Cost (₹)"
                  type="number"
                  placeholder="Estimated valuation applied here"
                  error={errorsBuy.buyPrice?.message}
                  required
                  {...registerBuy('buyPrice', { required: 'Buy price is required' })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Customer Seller Name"
                  placeholder="Seller full name"
                  error={errorsBuy.sellerName?.message}
                  required
                  {...registerBuy('sellerName', { required: 'Seller name is required' })}
                />
                <Input
                  label="Customer Seller Contact Phone"
                  placeholder="Seller phone"
                  error={errorsBuy.sellerPhone?.message}
                  required
                  {...registerBuy('sellerPhone', { required: 'Seller phone is required' })}
                />
              </div>

              <Textarea
                label="Repair Requirements / Servicing Details"
                placeholder="e.g. Battery replacement needed (currently 78% health), back glass cracked."
                {...registerBuy('repairDetails')}
              />

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" className="rounded-xl px-5" onClick={() => setActiveTab('inventory')} type="button">Cancel</Button>
                <Button type="submit" variant="primary" className="rounded-xl px-6" loading={buyMutation.isPending}>
                  <FiCheck /> Record Intake Purchase
                </Button>
              </div>
            </form>
          </div>

          {/* Real-time valuation helper card */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl translate-x-4 -translate-y-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Live Buyback Evaluator</h3>

              {valuationData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-white/70 font-semibold uppercase">Estimated Acquisition Value</p>
                    <p className="text-3xl font-black mt-1">{formatCurrency(valuationData.estimatedValue)}</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl text-xs space-y-1">
                    <p className="font-semibold text-white/95 flex justify-between">Original Retail: <span>{formatCurrency(watchedPrice)}</span></p>
                    <p className="font-semibold text-white/95 flex justify-between">Condition Applied: <span className="capitalize">{watchedCondition}</span></p>
                  </div>
                  <p className="text-[10px] text-white/60 leading-relaxed italic border-t border-white/10 pt-3">
                    Valuation rates: Excellent (45%), Good (35%), Fair (25%), Poor (15%), Damaged (5%).
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center text-white/60">
                  <p className="text-xs">Enter original retail price and physical condition to run live shop trade-in valuations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Sell Price Modal */}
      <Modal isOpen={!!sellingItem} onClose={() => setSellingItem(null)} title="Sell pre-owned Device">
        {sellingItem && (
          <form onSubmit={handleSubmitSell(handleSell)} className="p-6 space-y-4">
            <div>
              <p className="text-xs text-slate-400">Device model:</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{sellingItem.deviceName}</p>
              <p className="text-xs text-slate-400 mt-2">Buyback cost: {formatCurrency(sellingItem.buyPrice)}</p>
            </div>
            <Input
              label="Selling Price (₹)"
              name="sellPrice"
              type="number"
              placeholder="e.g. 45000"
              required
              {...registerSell('sellPrice', { required: true })}
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setSellingItem(null)}>Cancel</Button>
              <Button type="submit" variant="success" loading={sellMutation.isPending}>Complete Sale</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default SecondHand;
