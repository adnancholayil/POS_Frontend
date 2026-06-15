import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiPackage, FiPlusCircle, FiMinusCircle, FiAlertCircle,
  FiActivity, FiSearch, FiCheck, FiArrowRight
} from 'react-icons/fi';
import { inventoryApi, productApi } from '../api/services';
import { TableCard } from '../components/ui/DataTable';
import { Input, Select, Textarea, SearchInput } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDateTime } from '../utils/helpers';

export const Inventory = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'in' | 'out' | 'low' | 'history'

  React.useEffect(() => {
    if (location.pathname.endsWith('/stock-in')) {
      setActiveTab('in');
    } else if (location.pathname.endsWith('/stock-out')) {
      setActiveTab('out');
    } else if (location.pathname.endsWith('/low-stock')) {
      setActiveTab('low');
    } else if (location.pathname.endsWith('/history')) {
      setActiveTab('history');
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname]);
  const [search, setSearch] = useState('');

  // Forms
  const { register: registerIn, handleSubmit: handleSubmitIn, reset: resetIn, formState: { errors: errorsIn } } = useForm();
  const { register: registerOut, handleSubmit: handleSubmitOut, reset: resetOut, formState: { errors: errorsOut } } = useForm();

  // Queries
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.getAll().then(res => res.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll().then(res => res.data),
  });

  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['inventoryHistory'],
    queryFn: () => inventoryApi.getHistory().then(res => res.data),
  });

  // Mutations
  const stockInMutation = useMutation({
    mutationFn: (data) => inventoryApi.stockIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryHistory'] });
      addToast('Stock received and updated successfully', 'success');
      resetIn();
      navigate('/inventory');
    },
    onError: () => addToast('Failed to log stock in', 'error'),
  });

  const stockOutMutation = useMutation({
    mutationFn: (data) => inventoryApi.stockOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryHistory'] });
      addToast('Stock adjusted out successfully', 'success');
      resetOut();
      navigate('/inventory');
    },
    onError: () => addToast('Failed to log stock out', 'error'),
  });

  const handleStockIn = (data) => {
    stockInMutation.mutate({
      items: [{
        productId: data.productId,
        qty: Number(data.qty),
        cost: data.cost ? Number(data.cost) : undefined,
        imeiList: data.imeis ? data.imeis.split(',').map(i => i.trim()).filter(Boolean) : []
      }]
    });
  };

  const handleStockOut = (data) => {
    stockOutMutation.mutate({
      items: [{
        productId: data.productId,
        qty: Number(data.qty),
        imeiList: data.imeis ? data.imeis.split(',').map(i => i.trim()).filter(Boolean) : []
      }],
      reason: data.reason
    });
  };

  // Filter lists
  const filteredOverview = inventory.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.stock <= item.minStock);

  // Columns configurations
  const overviewColumns = [
    { label: 'SKU', key: 'sku', className: 'font-mono text-xs text-slate-500' },
    { label: 'Item Name', key: 'name', className: 'font-bold text-slate-800 dark:text-slate-200' },
    { label: 'Category', key: 'category' },
    { label: 'Quantity', key: 'stock', render: (val, row) => val <= row.minStock ? <span className="text-red-500 font-bold">{val}</span> : val },
    { label: 'Unit Cost', key: 'cost', render: (val) => formatCurrency(val) },
    { label: 'Total Stock Value', key: 'value', render: (val) => formatCurrency(val), className: 'font-semibold' },
  ];

  const historyColumns = [
    { label: 'Timestamp', key: 'date', render: (val) => formatDateTime(val), className: 'text-xs text-slate-500' },
    {
      label: 'Operation Type',
      key: 'type',
      render: (val) => val === 'stock_in'
        ? <Badge variant="success" className="gap-1"><FiPlusCircle /> Stock In</Badge>
        : <Badge variant="danger" className="gap-1"><FiMinusCircle /> Stock Out</Badge>
    },
    { label: 'Item Details', key: 'name', className: 'font-semibold' },
    { label: 'Qty', key: 'qty', render: (val, row) => row.type === 'stock_in' ? `+${val}` : `-${val}` },
    { label: 'Ref Document', key: 'reference', className: 'font-mono text-xs' },
    { label: 'Handled By', key: 'operator', className: 'text-xs' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Inventory Registry</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage stock procurement, adjustments, low-stock notifications, and history logs.</p>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4">
        {[
          { id: 'overview', label: 'Stock Overview', icon: <FiPackage /> },
          { id: 'in', label: 'Stock In Intake', icon: <FiPlusCircle /> },
          { id: 'out', label: 'Stock Out / Loss', icon: <FiMinusCircle /> },
          { id: 'low', label: 'Low Stock Alerts', icon: <FiAlertCircle /> },
          { id: 'history', label: 'Movement Logs', icon: <FiActivity /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              const paths = {
                overview: '/inventory',
                in: '/inventory/stock-in',
                out: '/inventory/stock-out',
                low: '/inventory/low-stock',
                history: '/inventory/history'
              };
              navigate(paths[t.id]);
            }}
            className={`pb-3 text-sm font-bold border-b-2 transition-all px-1.5 flex items-center gap-2 ${
              activeTab === t.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Search inventory items by name, SKU..."
          />
          <TableCard
            columns={overviewColumns}
            data={filteredOverview}
            loading={isLoading}
            emptyTitle="No inventory data"
          />
        </div>
      )}

      {/* STOCK IN TAB */}
      {activeTab === 'in' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mx-auto">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">Record Procurement Stock Intake</h2>
          <p className="text-[11px] text-slate-400 mb-6">Update catalog stock by recording bulk hardware delivery from suppliers.</p>

          <form onSubmit={handleSubmitIn(handleStockIn)} className="space-y-4">
            <Select
              label="Select Catalog Product"
              options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
              placeholder="-- Choose Product --"
              error={errorsIn.productId?.message}
              required
              {...registerIn('productId', { required: 'Please select a product' })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Received Quantity"
                type="number"
                placeholder="e.g. 10"
                error={errorsIn.qty?.message}
                required
                {...registerIn('qty', { required: 'Quantity is required', min: { value: 1, message: 'Must be at least 1' } })}
              />
              <Input
                label="New Unit Cost (Leave blank to keep existing)"
                type="number"
                placeholder="e.g. 45000"
                error={errorsIn.cost?.message}
                {...registerIn('cost')}
              />
            </div>

            <Input
              label="New IMEIs / Serial Numbers (Comma Separated)"
              placeholder="358762109876541, 358762109876542..."
              hint="Only mandatory for smartphones and laptops"
              {...registerIn('imeis')}
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" variant="success" className="rounded-xl px-6" loading={stockInMutation.isPending}>
                <FiCheck /> Record Inbound Stock
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* STOCK OUT TAB */}
      {activeTab === 'out' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mx-auto">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">Record Stock Out / Damage Adjustment</h2>
          <p className="text-[11px] text-slate-400 mb-6">Deduct item quantity due to internal usage, screen replacements, theft, or vendor returns.</p>

          <form onSubmit={handleSubmitOut(handleStockOut)} className="space-y-4">
            <Select
              label="Select Catalog Product"
              options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
              placeholder="-- Choose Product --"
              error={errorsOut.productId?.message}
              required
              {...registerOut('productId', { required: 'Please select a product' })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Quantity to Deduct"
                type="number"
                placeholder="e.g. 1"
                error={errorsOut.qty?.message}
                required
                {...registerOut('qty', { required: 'Quantity is required', min: { value: 1, message: 'Must be at least 1' } })}
              />
              <Select
                label="Reason for Adjustment"
                options={[
                  { value: 'damaged', label: 'Damaged / Defective Part' },
                  { value: 'theft', label: 'Theft / Missing' },
                  { value: 'repair', label: 'Used in Customer Repair Service' },
                  { value: 'return', label: 'Returned to Supplier' },
                ]}
                error={errorsOut.reason?.message}
                required
                {...registerOut('reason', { required: 'Please select an adjustment reason' })}
              />
            </div>

            <Input
              label="Deducted IMEIs / Serial Numbers (Comma Separated)"
              placeholder="358762109876541..."
              hint="Provide specific trackable serials to remove"
              {...registerOut('imeis')}
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" variant="danger" className="rounded-xl px-6" loading={stockOutMutation.isPending}>
                <FiCheck /> Record Stock Deduction
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* LOW STOCK TAB */}
      {activeTab === 'low' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-center gap-3">
            <FiAlertCircle className="text-lg shrink-0" />
            <span>The following items have stock counts at or below their set warning thresholds. Place bulk purchase orders soon.</span>
          </div>
          <TableCard
            columns={overviewColumns}
            data={lowStockItems}
            loading={isLoading}
            emptyTitle="All stock levels healthy!"
            emptyDescription="There are no items below low stock warnings."
          />
        </div>
      )}

      {/* MOVEMENT LOGS TAB */}
      {activeTab === 'history' && (
        <TableCard
          columns={historyColumns}
          data={history}
          loading={isLoadingHistory}
          emptyTitle="No stock movements recorded"
        />
      )}
    </div>
  );
};
export default Inventory;
