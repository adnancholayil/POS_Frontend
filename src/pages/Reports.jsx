import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiBarChart2, FiTrendingUp, FiTrendingDown,
  FiShoppingCart, FiTool, FiBriefcase, FiDownload
} from 'react-icons/fi';
import { reportApi, repairApi } from '../api/services';
import { TableCard } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export const Reports = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'profit' | 'repairs'

  React.useEffect(() => {
    if (location.pathname.endsWith('/profit')) {
      setActiveTab('profit');
    } else if (location.pathname.endsWith('/repairs')) {
      setActiveTab('repairs');
    } else {
      setActiveTab('sales');
    }
  }, [location.pathname]);

  // Queries
  const { data: salesReport, isLoading: isLoadingSales } = useQuery({
    queryKey: ['salesReport'],
    queryFn: () => reportApi.getSales().then(res => res.data),
  });

  const { data: profitReport, isLoading: isLoadingProfit } = useQuery({
    queryKey: ['profitReport'],
    queryFn: () => reportApi.getProfit().then(res => res.data),
  });

  const { data: repairStats } = useQuery({
    queryKey: ['repairStats'],
    queryFn: () => repairApi.getStats().then(res => res.data),
  });

  const handleExport = (type) => {
    addToast(`Exporting ${type} report as PDF/Excel... (demonstration mode)`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Generate P&L reports, review sales invoice catalogs, and examine technician productivity.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm text-xs font-bold" onClick={() => handleExport(activeTab)}>
            <FiDownload /> Export {activeTab.toUpperCase()} Data
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        {[
          { id: 'sales', label: 'Sales Reports', icon: <FiShoppingCart /> },
          { id: 'profit', label: 'Profit & Loss (P&L)', icon: <FiTrendingUp /> },
          { id: 'repairs', label: 'Service Analytics', icon: <FiTool /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(t.id === 'sales' ? '/reports' : `/reports/${t.id}`)}
            className={`pb-3 text-sm font-bold border-b-2 transition-all px-1 flex items-center gap-2 ${
              activeTab === t.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* SALES REPORT TAB */}
      {activeTab === 'sales' && salesReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Sales Revenue</p>
              <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{formatCurrency(salesReport.summary.totalSales)}</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tax Collected (GST)</p>
              <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{formatCurrency(salesReport.summary.taxCollected)}</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Discounts Given</p>
              <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100 text-red-500">{formatCurrency(salesReport.summary.discountsGiven)}</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Average Invoice Value</p>
              <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{formatCurrency(salesReport.summary.avgTicket)}</p>
            </div>
          </div>

          <TableCard
            title="Invoiced Transactions audit"
            columns={[
              { label: 'Invoice No', key: 'invoiceNo', className: 'font-mono text-xs font-semibold' },
              { label: 'Date', key: 'createdAt', render: (val) => formatDateTime(val), className: 'text-xs text-slate-500' },
              { label: 'Customer Name', key: 'customerName', className: 'font-bold' },
              { label: 'Subtotal', key: 'subtotal', render: (val) => formatCurrency(val) },
              { label: 'Discount', key: 'discount', render: (val) => formatCurrency(val), className: 'text-red-500' },
              { label: 'Grand Total', key: 'total', render: (val) => formatCurrency(val), className: 'font-extrabold' },
            ]}
            data={salesReport.salesList}
            loading={isLoadingSales}
            emptyTitle="No invoices recorded"
          />
        </div>
      )}

      {/* PROFIT & LOSS TAB */}
      {activeTab === 'profit' && profitReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
              <FiTrendingUp className="text-3xl text-green-500 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Profit</p>
              <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{formatCurrency(profitReport.grossProfit)}</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
              <FiTrendingDown className="text-3xl text-red-500 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated Shop expenses</p>
              <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100 text-red-500">{formatCurrency(profitReport.expenses)}</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
              <FiBriefcase className="text-3xl text-blue-500 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase">Net Shop Profit</p>
              <p className="text-2xl font-black mt-1 text-green-600 dark:text-green-400">{formatCurrency(profitReport.netProfit)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider">Revenue vs Profit margins (H1 Period)</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitReport.profitHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgb(15, 23, 42)', color: '#fff', borderRadius: '12px', border: 'none' }}
                    formatter={(val) => [formatCurrency(val)]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" name="Total Revenue" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" name="Net Profit" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE ANALYTICS TAB */}
      {activeTab === 'repairs' && repairStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-6">Service Ticket distribution</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Completed', value: repairStats.delivered },
                    { name: 'Repairing', value: repairStats.repairing },
                    { name: 'Ready', value: repairStats.ready },
                    { name: 'Diagnosing', value: repairStats.pending }
                  ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgb(15, 23, 42)', color: '#fff', borderRadius: '12px', border: 'none' }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Ticket Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Service center KPI Performance</h3>
              <div className="space-y-4">
                {[
                  { label: 'Completed Deliveries', val: repairStats.delivered, rate: '85%' },
                  { label: 'Under Repair', val: repairStats.repairing, rate: '10%' },
                  { label: 'Requires Attention', val: repairStats.pending, rate: '5%' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/40 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.val} active tickets</p>
                    </div>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">{item.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Reports;
