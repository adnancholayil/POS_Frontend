import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiShield, FiSearch, FiCalendar, FiClock,
  FiAlertTriangle, FiCheckCircle, FiBookOpen, FiFileText
} from 'react-icons/fi';
import { warrantyApi } from '../api/services';
import { TableCard } from '../components/ui/DataTable';
import { Input, SearchInput } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatDateTime, daysUntil } from '../utils/helpers';

export const Warranty = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'expiring'

  // Queries
  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ['warranties'],
    queryFn: () => warrantyApi.getAll().then(res => res.data),
  });

  const { data: expiring = [], isLoading: isLoadingExpiring } = useQuery({
    queryKey: ['expiringWarranties'],
    queryFn: () => warrantyApi.getExpiring(30).then(res => res.data),
  });

  // Filter list
  const filteredWarranties = warranties.filter(w =>
    w.itemName.toLowerCase().includes(search.toLowerCase()) || 
    w.serialOrImei.includes(search) || 
    w.customerName.toLowerCase().includes(search.toLowerCase()) ||
    w.invoiceNo.includes(search)
  );

  const columns = [
    { label: 'Invoice No', key: 'invoiceNo', className: 'font-mono text-xs font-semibold text-slate-500' },
    { label: 'Item Name', key: 'itemName', className: 'font-bold text-slate-800 dark:text-slate-200' },
    { label: 'IMEI / Serial', key: 'serialOrImei', className: 'font-mono text-xs' },
    { label: 'Customer', key: 'customerName' },
    { label: 'Coverage Start', key: 'startDate', render: (val) => new Date(val).toLocaleDateString(), className: 'text-xs text-slate-500' },
    { label: 'Coverage End', key: 'endDate', render: (val) => new Date(val).toLocaleDateString(), className: 'text-xs text-slate-500' },
    {
      label: 'Days Left',
      key: 'endDate',
      render: (val) => {
        const days = daysUntil(val);
        if (days < 0) return <span className="text-red-500 font-bold">Expired</span>;
        if (days <= 30) return <span className="text-amber-500 font-bold">{days} days</span>;
        return <span className="text-green-500 font-semibold">{days} days</span>;
      }
    },
    {
      label: 'Status',
      key: 'status',
      render: (val, row) => {
        const days = daysUntil(row.endDate);
        if (days < 0) return <Badge variant="danger">Expired</Badge>;
        if (days <= 30) return <Badge variant="warning">Expiring</Badge>;
        return <Badge variant="success">Active</Badge>;
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Warranty Records</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Lookup item serialized warranties, trace invoice records, and monitor hardware coverage expiration timelines.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-1 flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FiShield /> Active Warranties ({warranties.length})
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-1 flex items-center gap-2 ${
            activeTab === 'expiring'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FiAlertTriangle className="text-amber-500" /> Expiring (30 days) ({expiring.length})
        </button>
      </div>

      {activeTab === 'all' ? (
        <div className="space-y-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Search warranties by IMEI, model name, customer name, invoice..."
          />
          <TableCard
            columns={columns}
            data={filteredWarranties}
            loading={isLoading}
            emptyTitle="No warranty cards registered"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-center gap-3">
            <FiAlertTriangle className="text-lg shrink-0" />
            <span>The following items have warranties expiring in the next 30 days. Prepare to alert customers or plan service coverage upgrades.</span>
          </div>
          <TableCard
            columns={columns}
            data={expiring}
            loading={isLoadingExpiring}
            emptyTitle="No warranties expiring soon"
          />
        </div>
      )}
    </div>
  );
};
export default Warranty;
