import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiTool, FiPlusCircle, FiUser, FiActivity, FiCpu,
  FiTrendingUp, FiSearch, FiEdit, FiTrash, FiCheck, FiSettings, FiPlus
} from 'react-icons/fi';
import { repairApi, staffApi } from '../api/services';
import { TableCard } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea, SearchInput } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { REPAIR_STATUS, REPAIR_STATUS_LABELS, REPAIR_STATUS_COLORS } from '../utils/constants';

export const Repairs = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'new'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  React.useEffect(() => {
    if (location.pathname.endsWith('/new')) {
      setActiveTab('new');
    } else {
      setActiveTab('tickets');
    }
  }, [location.pathname]);

  // Modals state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isPartsOpen, setIsPartsOpen] = useState(false);

  // Forms
  const { register: registerNew, handleSubmit: handleSubmitNew, reset: resetNew, formState: { errors: errorsNew } } = useForm();
  const { register: registerPart, handleSubmit: handleSubmitPart, reset: resetPart } = useForm();

  // Queries
  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ['repairs'],
    queryFn: () => repairApi.getAll().then(res => res.data),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll().then(res => res.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['repairStats'],
    queryFn: () => repairApi.getStats().then(res => res.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => repairApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['repairStats'] });
      addToast('Repair ticket registered successfully', 'success');
      resetNew();
      navigate('/repairs');
    },
    onError: () => addToast('Failed to log repair ticket', 'error'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => repairApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['repairStats'] });
      addToast('Ticket status updated successfully', 'success');
      setIsStatusOpen(false);
      setSelectedTicket(null);
    },
    onError: () => addToast('Failed to update status', 'error'),
  });

  const assignTechMutation = useMutation({
    mutationFn: ({ id, technicianId }) => repairApi.assignTechnician(id, { technicianId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      addToast('Technician assigned successfully', 'success');
      setIsAssignOpen(false);
      setSelectedTicket(null);
    },
    onError: () => addToast('Failed to assign technician', 'error'),
  });

  const addPartMutation = useMutation({
    mutationFn: ({ id, part }) => repairApi.addPart(id, part),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      addToast('Replacement part added to billing', 'success');
      setIsPartsOpen(false);
      setSelectedTicket(null);
      resetPart();
    },
    onError: () => addToast('Failed to add part', 'error'),
  });

  const handleCreate = (data) => {
    createMutation.mutate({
      ...data,
      estimate: Number(data.estimate || 0),
    });
  };

  const handleAddPartSubmit = (data) => {
    addPartMutation.mutate({
      id: selectedTicket.id,
      part: {
        name: data.partName,
        cost: Number(data.partCost),
        qty: Number(data.partQty || 1),
      }
    });
  };

  // Filters
  const filteredRepairs = repairs.filter(r => {
    const matchesSearch = r.deviceName.toLowerCase().includes(search.toLowerCase()) || 
      r.customerName.toLowerCase().includes(search.toLowerCase()) || 
      r.ticketNo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { label: 'Ticket No', key: 'ticketNo', className: 'font-mono text-xs font-semibold text-slate-500' },
    { label: 'Device Model', key: 'deviceName', className: 'font-bold' },
    { label: 'Customer Name', key: 'customerName' },
    {
      label: 'Technician',
      key: 'technicianId',
      render: (val) => {
        const member = staff.find(s => s.id === val);
        return member ? member.name : <span className="text-slate-400 italic">Unassigned</span>;
      }
    },
    { label: 'Est. Charges', key: 'estimate', render: (val) => formatCurrency(val), className: 'font-semibold' },
    {
      label: 'Ticket Status',
      key: 'status',
      render: (val) => (
        <Badge variant="custom" className={`${REPAIR_STATUS_COLORS[val] || ''} text-[10px] uppercase font-bold tracking-wide`}>
          {REPAIR_STATUS_LABELS[val]}
        </Badge>
      )
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setSelectedTicket(row); setIsStatusOpen(true); }}
            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 transition-colors"
            title="Update Status"
          >
            <FiActivity className="text-sm" />
          </button>
          <button
            onClick={() => { setSelectedTicket(row); setIsAssignOpen(true); }}
            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
            title="Assign Tech"
          >
            <FiUser className="text-sm" />
          </button>
          <button
            onClick={() => { setSelectedTicket(row); setIsPartsOpen(true); }}
            className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 transition-colors"
            title="Add Parts"
          >
            <FiPlus className="text-sm" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Service & Repairs Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track device troubleshooting diagnostics, technician labor, status updates, and spare parts billing.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'new' ? 'secondary' : 'primary'}
            className="rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm"
            onClick={() => navigate(activeTab === 'tickets' ? '/repairs/new' : '/repairs')}
          >
            {activeTab === 'tickets' ? <><FiPlusCircle /> New Ticket Intake</> : <><FiTool /> View Tickets</>}
          </Button>
        </div>
      </div>

      {/* Stats Board */}
      {stats && activeTab === 'tickets' && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total Jobs', val: stats.total, color: 'text-slate-700 bg-slate-100' },
            { label: 'Diagnosing', val: stats.pending, color: 'text-blue-600 bg-blue-50' },
            { label: 'Repairing', val: stats.repairing, color: 'text-purple-600 bg-purple-50' },
            { label: 'Ready for delivery', val: stats.ready, color: 'text-green-600 bg-green-50' },
            { label: 'Delivered', val: stats.delivered, color: 'text-emerald-600 bg-emerald-50' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{item.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* TICKETS TAB */}
      {activeTab === 'tickets' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder="Search by ticket no, device, customer name..."
              className="sm:col-span-2"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={Object.entries(REPAIR_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
              placeholder="All Ticket Statuses"
            />
          </div>

          <TableCard
            columns={columns}
            data={filteredRepairs}
            loading={isLoading}
            emptyTitle="No repair tickets registered"
            onRowClick={(row) => setSelectedTicket(row)}
          />
        </div>
      ) : (
        /* NEW TICKET INTAKE FORM */
        <div className="max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mx-auto">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">New Device Repair Intake Registry</h2>
          <p className="text-[11px] text-slate-400 mb-6">Create a service tracking ticket for malfunctioning customer hardware.</p>

          <form onSubmit={handleSubmitNew(handleCreate)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Customer Full Name"
                placeholder="e.g. John Doe"
                error={errorsNew.customerName?.message}
                required
                {...registerNew('customerName', { required: 'Customer name is required' })}
              />
              <Input
                label="Customer Contact Phone"
                placeholder="e.g. 9876543210"
                error={errorsNew.customerPhone?.message}
                required
                {...registerNew('customerPhone', { required: 'Customer phone is required' })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Malfunctioning Device Brand & Model"
                placeholder="e.g. Apple iPhone 14 Pro Max"
                error={errorsNew.deviceName?.message}
                required
                {...registerNew('deviceName', { required: 'Device name is required' })}
              />
              <Input
                label="IMEI Number or Serial Number"
                placeholder="Unique identifier for service audit"
                {...registerNew('serialOrImei')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Initial Estimated Estimate Repair Bill (₹)"
                type="number"
                placeholder="e.g. 4500"
                error={errorsNew.estimate?.message}
                {...registerNew('estimate')}
              />
              <Select
                label="Assign Initial Diagnostics Technician"
                options={staff.map(s => ({ value: s.id, label: `${s.name} (${s.role.toUpperCase()})` }))}
                placeholder="-- Select Technician --"
                {...registerNew('technicianId')}
              />
            </div>

            <Textarea
              label="Intake Defect Issue & Troubleshooting Notes"
              placeholder="e.g. Device does not charge when plugged in. Moisture damage suspected around USB-C port."
              error={errorsNew.issueDescription?.message}
              required
              {...registerNew('issueDescription', { required: 'Issue description is required' })}
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" className="rounded-xl px-5" onClick={() => setActiveTab('tickets')} type="button">Cancel</Button>
              <Button type="submit" variant="primary" className="rounded-xl px-6" loading={createMutation.isPending}>
                <FiCheck /> Register Intake Ticket
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Details/Ticket Sheet Modal */}
      <Modal isOpen={!!selectedTicket && !isStatusOpen && !isAssignOpen && !isPartsOpen} onClose={() => setSelectedTicket(null)} title="Repair Ticket Overview" size="md">
        {selectedTicket && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-400 font-mono">{selectedTicket.ticketNo}</span>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{selectedTicket.deviceName}</h3>
              </div>
              <Badge variant="custom" className={`${REPAIR_STATUS_COLORS[selectedTicket.status] || ''} text-[10px] uppercase font-bold tracking-wide`}>
                {REPAIR_STATUS_LABELS[selectedTicket.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[9px]">Customer Profile</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedTicket.customerName}</p>
                <p className="text-slate-500 font-mono">{selectedTicket.customerPhone}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[9px]">Warranty Status / Serials</p>
                <p className="font-mono mt-0.5">{selectedTicket.serialOrImei || 'N/A'}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Diagnosed Defects</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{selectedTicket.issueDescription}</p>
            </div>

            {/* Replacement parts listing */}
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Billed Parts & Accessories</p>
              {selectedTicket.parts?.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No parts billed yet.</p>
              ) : (
                <div className="space-y-1">
                  {selectedTicket.parts?.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span>{p.name} (x{p.qty})</span>
                      <span className="font-semibold">{formatCurrency(p.cost * p.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Cumulative Estimate Repair Bill:</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(selectedTicket.estimate)}</span>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="primary" className="rounded-xl" onClick={() => setSelectedTicket(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal isOpen={isStatusOpen} onClose={() => { setIsStatusOpen(false); setSelectedTicket(null); }} title="Update Repair status">
        {selectedTicket && (
          <form onSubmit={(e) => { e.preventDefault(); updateStatusMutation.mutate({ id: selectedTicket.id, status: e.target.status.value }); }} className="p-6 space-y-4">
            <Select
              label="Select Current status"
              name="status"
              defaultValue={selectedTicket.status}
              options={Object.entries(REPAIR_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => { setIsStatusOpen(false); setSelectedTicket(null); }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={updateStatusMutation.isPending}>Save Status</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Assign Technician Modal */}
      <Modal isOpen={isAssignOpen} onClose={() => { setIsAssignOpen(false); setSelectedTicket(null); }} title="Assign Diagnostics Technician">
        {selectedTicket && (
          <form onSubmit={(e) => { e.preventDefault(); assignTechMutation.mutate({ id: selectedTicket.id, technicianId: e.target.techId.value }); }} className="p-6 space-y-4">
            <Select
              label="Select Shop Staff"
              name="techId"
              defaultValue={selectedTicket.technicianId}
              options={staff.map(s => ({ value: s.id, label: `${s.name} (${s.role})` }))}
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => { setIsAssignOpen(false); setSelectedTicket(null); }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={assignTechMutation.isPending}>Save Assignment</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Billing Parts Modal */}
      <Modal isOpen={isPartsOpen} onClose={() => { setIsPartsOpen(false); setSelectedTicket(null); }} title="Bill Replacement Hardware Parts">
        {selectedTicket && (
          <form onSubmit={handleSubmitPart(handleAddPartSubmit)} className="p-6 space-y-4">
            <Input
              label="Replacement Part Name"
              placeholder="e.g. OnePlus 11R Original Display Panel"
              required
              {...registerPart('partName', { required: true })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Part Billing Cost (₹)"
                type="number"
                placeholder="4200"
                required
                {...registerPart('partCost', { required: true })}
              />
              <Input
                label="Qty"
                type="number"
                placeholder="1"
                {...registerPart('partQty')}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => { setIsPartsOpen(false); setSelectedTicket(null); }}>Cancel</Button>
              <Button type="submit" variant="success" loading={addPartMutation.isPending}>Bill Part & Update estimate</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default Repairs;
