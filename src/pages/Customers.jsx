import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  FiUsers, FiPlus, FiPhone, FiMail, FiSearch,
  FiBookOpen, FiShoppingCart, FiTool, FiShield, FiSave, FiX
} from 'react-icons/fi';
import { customerApi } from '../api/services';
import { TableCard } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, SearchInput } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDateTime } from '../utils/helpers';

export const Customers = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState(null);

  // Notes state
  const [customerNote, setCustomerNote] = useState('');

  // Forms
  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd, formState: { errors: errorsAdd } } = useForm();

  // Queries
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerApi.getAll().then(res => res.data),
  });

  const { data: purchaseHistory = [] } = useQuery({
    queryKey: ['custPurchases', selectedCust?.id],
    queryFn: () => customerApi.getPurchaseHistory(selectedCust.id).then(res => res.data),
    enabled: !!selectedCust,
  });

  const { data: repairHistory = [] } = useQuery({
    queryKey: ['custRepairs', selectedCust?.id],
    queryFn: () => customerApi.getRepairHistory(selectedCust.id).then(res => res.data),
    enabled: !!selectedCust,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => customerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      addToast('Customer profile registered', 'success');
      setIsAddOpen(false);
      resetAdd();
    },
    onError: () => addToast('Failed to add customer', 'error'),
  });

  const noteMutation = useMutation({
    mutationFn: ({ id, notes }) => customerApi.addNote(id, { notes }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      addToast('Customer notes updated', 'success');
      setSelectedCust(res.data);
    },
    onError: () => addToast('Failed to save notes', 'error'),
  });

  const handleAddSubmit = (data) => {
    createMutation.mutate(data);
  };

  const handleSaveNote = () => {
    noteMutation.mutate({ id: selectedCust.id, notes: customerNote });
  };

  // Filter
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const columns = [
    { label: 'Customer Name', key: 'name', className: 'font-bold text-slate-800 dark:text-slate-200' },
    { label: 'Contact Phone', key: 'phone', className: 'font-mono text-xs' },
    { label: 'Email', key: 'email' },
    { label: 'Loyalty Points', key: 'points', render: (val) => <span className="font-bold text-blue-600 dark:text-blue-400">{val} pts</span> },
    { label: 'Sales Orders', key: 'totalPurchases', render: (val) => `${val} bills` },
    { label: 'Service Tickets', key: 'totalRepairs', render: (val) => `${val} tickets` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Customer Database</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage customer records, purchase tracking, repair logs, and loyalty points rewards.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" className="rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm" onClick={() => setIsAddOpen(true)}>
            <FiPlus /> Add Customer
          </Button>
        </div>
      </div>

      {/* Controls */}
      <SearchInput
        value={search}
        onChange={setSearch}
        onClear={() => setSearch('')}
        placeholder="Search customers by name, phone..."
      />

      {/* Table Card */}
      <TableCard
        columns={columns}
        data={filteredCustomers}
        loading={isLoading}
        emptyTitle="No customer profiles found"
        onRowClick={(row) => {
          setSelectedCust(row);
          setCustomerNote(row.notes || '');
        }}
      />

      {/* Add Customer Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Customer" size="md">
        <form onSubmit={handleSubmitAdd(handleAddSubmit)} className="p-6 space-y-4">
          <Input
            label="Customer Full Name"
            placeholder="e.g. Rahul Verma"
            error={errorsAdd.name?.message}
            required
            {...registerAdd('name', { required: 'Name is required' })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              placeholder="e.g. 9876543210"
              error={errorsAdd.phone?.message}
              required
              {...registerAdd('phone', { required: 'Phone is required' })}
            />
            <Input
              label="Email Address"
              placeholder="name@gmail.com"
              {...registerAdd('email')}
            />
          </div>
          <Textarea
            label="Internal Customer Notes"
            placeholder="e.g. Requests screen guard for every buy; pays with UPI."
            {...registerAdd('notes')}
          />
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" className="rounded-xl px-5" onClick={() => setIsAddOpen(false)} type="button">Cancel</Button>
            <Button type="submit" variant="primary" className="rounded-xl px-5" loading={createMutation.isPending}>Register</Button>
          </div>
        </form>
      </Modal>

      {/* Customer profile sheet Modal */}
      <Modal isOpen={!!selectedCust} onClose={() => setSelectedCust(null)} title="Customer Membership Profile" size="lg">
        {selectedCust && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-4 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{selectedCust.name}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-mono"><FiPhone /> {selectedCust.phone} {selectedCust.email && <>• <FiMail /> {selectedCust.email}</>}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-center border border-blue-500/20 shrink-0">
                <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase">Loyalty points balance</p>
                <p className="text-lg font-black text-blue-700 dark:text-blue-300 mt-0.5">{selectedCust.points} pts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Purchases history */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-1.5"><FiShoppingCart className="text-blue-500" /> Purchase Invoices</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {purchaseHistory.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No invoice history recorded.</p>
                  ) : (
                    purchaseHistory.map(invoice => (
                      <div key={invoice.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{invoice.invoiceNo}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="font-bold">{formatCurrency(invoice.total)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Service tickets history */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-1.5"><FiTool className="text-indigo-500" /> Service Tickets</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {repairHistory.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No repair tickets recorded.</p>
                  ) : (
                    repairHistory.map(ticket => (
                      <div key={ticket.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{ticket.deviceName}</p>
                          <p className="text-[9px] font-mono text-slate-400 mt-0.5">{ticket.ticketNo} • {new Date(ticket.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="font-semibold text-slate-600 dark:text-slate-400">{formatCurrency(ticket.estimate)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Custom Notes Section */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <Textarea
                label="Shop Internal Customer Notes"
                placeholder="Write custom instructions or preferences..."
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  className="rounded-xl flex items-center gap-1.5 text-xs py-2 px-4 shadow-sm"
                  onClick={handleSaveNote}
                  loading={noteMutation.isPending}
                >
                  <FiSave /> Save Note
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Customers;
