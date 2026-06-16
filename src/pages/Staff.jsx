import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiUsers, FiPlus, FiCalendar, FiTrendingUp,
  FiClock, FiAward, FiCheck, FiMail, FiPhone, FiSearch
} from 'react-icons/fi';
import { staffApi, settingsApi } from '../api/services';
import { TableCard } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Input, Select, SearchInput } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/helpers';
import { ROLE_LABELS } from '../utils/constants';

export const Staff = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'attendance' | 'performance'
  const [search, setSearch] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('staff2'); // Default to technician Malhotra

  React.useEffect(() => {
    if (location.pathname.endsWith('/attendance')) {
      setActiveTab('attendance');
    } else if (location.pathname.endsWith('/performance')) {
      setActiveTab('performance');
    } else {
      setActiveTab('directory');
    }
  }, [location.pathname]);

  // Forms
  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd, formState: { errors: errorsAdd } } = useForm();

  // Queries
  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll().then(res => res.data),
  });

  const { data: attendance = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendance', selectedStaffId],
    queryFn: () => staffApi.getAttendance(selectedStaffId).then(res => res.data),
    enabled: !!selectedStaffId,
  });

  const { data: performance, isLoading: isLoadingPerf } = useQuery({
    queryKey: ['performance', selectedStaffId],
    queryFn: () => staffApi.getPerformance(selectedStaffId).then(res => res.data),
    enabled: !!selectedStaffId,
  });

  const { data: shopSettings } = useQuery({
    queryKey: ['shopSettings'],
    queryFn: () => settingsApi.getShop().then(res => res.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => staffApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      addToast('Staff member added successfully', 'success');
      resetAdd();
    },
    onError: () => addToast('Failed to add staff member', 'error'),
  });

  const clockMutation = useMutation({
    mutationFn: (data) => staffApi.markAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      addToast('Shift clocked successfully', 'success');
    },
    onError: () => addToast('Failed to mark attendance', 'error'),
  });

  const handleAddSubmit = (data) => {
    createMutation.mutate(data);
  };

  const handleClockIn = () => {
    clockMutation.mutate({ staffId: selectedStaffId, type: 'in' });
  };

  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  );

  const directoryColumns = [
    { label: 'Staff Name', key: 'name', className: 'font-bold text-slate-800 dark:text-slate-200' },
    { label: 'Official Role', key: 'role', render: (val) => ROLE_LABELS[val] || val, className: 'capitalize font-semibold' },
    { label: 'Contact Email', key: 'email', className: 'text-xs text-slate-500 font-mono' },
    { label: 'Contact Phone', key: 'phone', className: 'text-xs text-slate-500 font-mono' },
    { label: 'Status', key: 'status', render: (val) => val === 'active' ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Suspended</Badge> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Staff Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">View employees directories, clock shifts, and inspect sales and repair service performance metrics.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        {[
          { id: 'directory', label: 'Staff Directory', icon: <FiUsers /> },
          { id: 'attendance', label: 'Attendance Shifts', icon: <FiCalendar /> },
          { id: 'performance', label: 'Performance Metrics', icon: <FiTrendingUp /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(t.id === 'directory' ? '/staff' : `/staff/${t.id}`)}
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

      {/* DIRECTORY TAB */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder="Search staff members..."
            />
            <TableCard
              columns={directoryColumns}
              data={filteredStaff}
              loading={isLoading}
              emptyTitle="No staff profiles registered"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">Onboard New Staff</h2>
            <p className="text-[11px] text-slate-400 mb-4">Add new managers, billing salesmen, or repair technicians to the portal credentials.</p>

            <form onSubmit={handleSubmitAdd(handleAddSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="e.g. Ramesh Chandra"
                error={errorsAdd.name?.message}
                required
                {...registerAdd('name', { required: 'Name is required' })}
              />
              <Input
                label="Email address"
                placeholder="e.g. ramesh@zylox.com"
                error={errorsAdd.email?.message}
                required
                {...registerAdd('email', { required: 'Email is required' })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact Phone"
                  placeholder="e.g. 9876543210"
                  error={errorsAdd.phone?.message}
                  required
                  {...registerAdd('phone', { required: 'Phone is required' })}
                />
                <Select
                  label="Shop Role"
                  options={[
                    { value: 'admin', label: 'Admin / Owner' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'salesman', label: 'Salesman' },
                  ]}
                  error={errorsAdd.role?.message}
                  required
                  {...registerAdd('role', { required: 'Role is required' })}
                />
              </div>
              <Input
                label="Login Password"
                type="password"
                placeholder="Minimum 8 characters"
                error={errorsAdd.password?.message}
                required
                {...registerAdd('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' }
                })}
              />
              <Button type="submit" variant="primary" fullWidth className="rounded-xl" loading={createMutation.isPending}>Add Employee</Button>
            </form>
            {shopSettings?.shopCode && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">🔑 Staff Login Details:</p>
                <p>
                  To access their account, the new staff member will need your Shop Code:
                  <span className="block mt-1 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 px-2.5 py-1 rounded border border-blue-100 dark:border-blue-900/40 w-fit select-all">
                    {shopSettings.shopCode}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
          {/* Selector & Clock In box */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <Select
                label="Inspect Staff Member"
                options={staffList.map(s => ({ value: s.id, label: `${s.name} (${ROLE_LABELS[s.role]})` }))}
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              />
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl p-6 shadow-md text-center">
              <FiClock className="text-4xl mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Clock Shift Register</h3>
              <p className="text-xs text-white/70 mt-1">Clock check-in and check-out logs for today's active shift schedule.</p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button variant="success" fullWidth className="rounded-xl font-bold py-2.5" onClick={handleClockIn} loading={clockMutation.isPending}>
                  Clock In
                </Button>
                <Button variant="danger" fullWidth className="rounded-xl font-bold py-2.5" onClick={handleClockIn} loading={clockMutation.isPending}>
                  Clock Out
                </Button>
              </div>
            </div>
          </div>

          {/* Attendance history log */}
          <div className="md:col-span-3">
            <TableCard
              columns={[
                { label: 'Shift Date', key: 'date', render: (val) => new Date(val).toLocaleDateString(), className: 'font-bold' },
                {
                  label: 'Attendance Status',
                  key: 'status',
                  render: (val) => val === 'present' ? <Badge variant="success">Present</Badge> : <Badge variant="danger">Absent</Badge>
                },
                { label: 'Check In', key: 'checkIn', className: 'font-mono text-xs text-slate-500' },
                { label: 'Check Out', key: 'checkOut', className: 'font-mono text-xs text-slate-500' },
              ]}
              data={attendance}
              loading={isLoadingAttendance}
              emptyTitle="No shift logs logged"
            />
          </div>
        </div>
      )}

      {/* PERFORMANCE TAB */}
      {activeTab === 'performance' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <Select
              label="Select Employee"
              options={staffList.map(s => ({ value: s.id, label: `${s.name} (${ROLE_LABELS[s.role]})` }))}
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
            />
          </div>

          {isLoadingPerf ? (
            <div className="h-60 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ) : performance ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
                <FiAward className="text-3xl text-amber-500 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Average Customer Rating</p>
                <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{performance.avgRating} / 5.0</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
                <FiClock className="text-3xl text-blue-500 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tasks Completed</p>
                <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{performance.tasksCompleted} tasks</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
                <FiUsers className="text-3xl text-indigo-500 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Repairs Completed</p>
                <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{performance.repairsCompleted} tickets</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
                <FiTrendingUp className="text-3xl text-green-500 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Sales Amount Handled</p>
                <p className="text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{formatCurrency(performance.salesAmount)}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-10">No performance records for this employee.</p>
          )}
        </div>
      )}
    </div>
  );
};
export default Staff;
