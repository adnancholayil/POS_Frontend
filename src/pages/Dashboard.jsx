import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FiTrendingUp, FiTool, FiBox, FiCheckSquare,
  FiArrowUpRight, FiShoppingCart, FiClock, FiPlus
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { reportApi } from '../api/services';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatCurrency, formatNumber } from '../utils/helpers';
import { Badge } from '../components/ui/Badge';
import { REPAIR_STATUS_LABELS, REPAIR_STATUS_COLORS } from '../utils/constants';

const StatCard = ({ title, value, icon, trend, link, color }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden"
  >
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} text-white shadow-sm`}>
        {icon}
      </div>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{value}</span>
      {trend && (
        <span className="text-[10px] font-bold text-green-500 flex items-center bg-green-500/10 px-1.5 py-0.5 rounded">
          {trend}
        </span>
      )}
    </div>
    {link && (
      <Link to={link} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-4 font-semibold">
        View details <FiArrowUpRight className="text-sm" />
      </Link>
    )}
  </motion.div>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: () => reportApi.getDashboard().then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20">
        Failed to load dashboard data. Please try again.
      </div>
    );
  }

  const { stats, chartData, recentSales, recentRepairs } = data;

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Welcome to your store console. Here is what is happening today.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/sales/pos" className="btn btn-primary shadow-sm rounded-xl py-2 px-4 flex items-center gap-2">
            <FiShoppingCart className="text-sm" /> POS Billing
          </Link>
          <Link to="/repairs/new" className="btn btn-secondary shadow-sm rounded-xl py-2 px-4 flex items-center gap-2">
            <FiPlus className="text-sm" /> New Ticket
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Revenue (Month)"
          value={formatCurrency(stats.totalSales)}
          icon={<FiTrendingUp className="text-lg" />}
          trend="+12.5%"
          link="/reports/sales"
          color="bg-blue-600"
        />
        <StatCard
          title="Repairs Completed"
          value={stats.completedRepairs}
          icon={<FiTool className="text-lg" />}
          trend="+4"
          link="/repairs"
          color="bg-indigo-600"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={<FiBox className="text-lg" />}
          trend={stats.lowStockItems > 0 ? `${stats.lowStockItems} critical` : 'Perfect'}
          link="/inventory/low-stock"
          color={stats.lowStockItems > 0 ? 'bg-amber-600' : 'bg-green-600'}
        />
        <StatCard
          title="Active Models Catalog"
          value={stats.totalProducts}
          icon={<FiCheckSquare className="text-lg" />}
          link="/products"
          color="bg-purple-600"
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider">Revenue Analytics (Last 7 Days)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgb(15, 23, 42)', color: '#fff', borderRadius: '12px', border: 'none' }}
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Small bar chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider">Profit Margin Trends</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgb(15, 23, 42)', color: '#fff', borderRadius: '12px', border: 'none' }}
                  formatter={(val) => [formatCurrency(val), 'Profit']}
                />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Checkout invoices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Recent Sales Checkouts</h2>
            <Link to="/sales" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">View History</Link>
          </div>
          <div className="space-y-4">
            {recentSales.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No recent sales transactions</p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between border-b last:border-0 border-slate-100 dark:border-slate-800/40 pb-3 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                      <FiShoppingCart className="text-sm" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{sale.invoiceNo}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sale.customerName || 'Walk-in Customer'} • {(sale.paymentMethod || 'cash').toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatCurrency(sale.total)}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Repair Tickets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Active Repair Tickets</h2>
            <Link to="/repairs" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">View Repairs</Link>
          </div>
          <div className="space-y-4">
            {recentRepairs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No active repair tickets</p>
            ) : (
              recentRepairs.map((repair) => (
                <div key={repair.id} className="flex items-center justify-between border-b last:border-0 border-slate-100 dark:border-slate-800/40 pb-3 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                      <FiTool className="text-sm" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{repair.deviceName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{repair.customerName} • Est. {formatCurrency(repair.estimate)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="custom" className={`${REPAIR_STATUS_COLORS[repair.status] || ''} text-[9px] px-2 py-0.5`}>
                      {REPAIR_STATUS_LABELS[repair.status]}
                    </Badge>
                    <p className="text-[9px] text-slate-400 mt-1 flex items-center justify-end gap-1"><FiClock /> {new Date(repair.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
