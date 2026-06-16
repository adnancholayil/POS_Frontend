import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiShoppingCart, FiSearch, FiTrash2, FiUser,
  FiFileText, FiRepeat, FiCheck, FiPrinter, FiPlus, FiMinus, FiCpu
} from 'react-icons/fi';
import { salesApi, productApi, customerApi } from '../api/services';
import { TableCard } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Input, Select, SearchInput } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { PAYMENT_METHODS } from '../utils/constants';

export const Sales = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'history' | 'returns'

  React.useEffect(() => {
    if (location.pathname.endsWith('/pos')) {
      setActiveTab('pos');
    } else if (location.pathname.endsWith('/returns')) {
      setActiveTab('returns');
    } else {
      setActiveTab('history');
    }
  }, [location.pathname]);
  const [posSearch, setPosSearch] = useState('');
  const [posCategory, setPosCategory] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const barcodeInputRef = React.useRef(null);

  React.useEffect(() => {
    if (activeTab === 'pos' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeTab]);

  // POS State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Checkout Receipt Modal
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);

  // Queries
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll().then(res => res.data),
  });

  const { data: sales = [], isLoading: isLoadingSales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesApi.getAll().then(res => res.data),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerApi.getAll().then(res => res.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories().then(res => res.data),
  });

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: (data) => salesApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      addToast('Transaction checkout completed successfully', 'success');
      setCheckoutResult(res.data);
      setCart([]);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setDiscount(0);
    },
    onError: () => addToast('Checkout processing failed', 'error'),
  });

  // POS CART ACTIONS
  const addToCart = (product) => {
    if (product.stock <= 0) {
      addToast('Item is out of stock', 'warning');
      return;
    }

    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.qty >= product.stock) {
        addToast('No more units available in stock', 'warning');
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        cost: product.cost,
        sku: product.sku,
        qty: 1,
        imeiRequired: product.imeiRequired,
        imeiList: product.imeiList || [],
        imei: ''
      }]);
    }
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

  const handleBarcodeScan = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeSearch.trim();
      if (!code) return;

      const matched = products.find(p => p.barcode && p.barcode.toLowerCase() === code.toLowerCase());
      if (matched) {
        addToCart(matched);
        addToast(`"${matched.name}" added to cart.`, 'success');
        setBarcodeSearch('');
      } else {
        try {
          const res = await productApi.getByBarcode(code);
          if (res && res.data) {
            addToCart(res.data);
            addToast(`"${res.data.name}" added to cart.`, 'success');
          } else {
            addToast(`No product found with barcode "${code}"`, 'error');
          }
        } catch (err) {
          addToast(`No product found with barcode "${code}"`, 'error');
        } finally {
          setBarcodeSearch('');
        }
      }
      setTimeout(() => barcodeInputRef.current?.focus(), 50);
    }
  };

  const updateCartQty = (productId, delta, maxStock) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.qty + delta;
        if (newQty > maxStock) {
          addToast('Cannot exceed physical stock limits', 'warning');
          return item;
        }
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const updateCartImei = (productId, imei) => {
    setCart(cart.map(item =>
      item.productId === productId ? { ...item, imei } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // CALCULATIONS
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartTax = +(cartSubtotal * 0.18).toFixed(2); // GST 18% standard
  const cartDiscountVal = discount;
  const cartTotal = Math.max(0, cartSubtotal + cartTax - cartDiscountVal);

  const handleCheckout = () => {
    if (cart.length === 0) {
      addToast('Your cart is empty', 'warning');
      return;
    }

    // Validate IMEIs
    const imeiMissing = cart.some(item => item.imeiRequired && !item.imei);
    if (imeiMissing) {
      addToast('Please enter an IMEI / Serial for all trackable models', 'warning');
      return;
    }

    checkoutMutation.mutate({
      customerName,
      customerPhone,
      items: cart.map(it => ({
        productId: it.productId,
        name: it.name,
        price: it.price,
        qty: it.qty,
        imei: it.imei
      })),
      subtotal: cartSubtotal,
      tax: cartTax,
      discount: cartDiscountVal,
      total: cartTotal,
      paymentMethod
    });
  };

  // Filter items
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(posSearch.toLowerCase()) || 
                          p.sku.toLowerCase().includes(posSearch.toLowerCase()) ||
                          (p.barcode && p.barcode.toLowerCase().includes(posSearch.toLowerCase()));
    const matchesCat = !posCategory || p.category === posCategory;
    return matchesSearch && matchesCat;
  });

  // Columns for Sales Invoices List
  const salesColumns = [
    { label: 'Invoice No', key: 'invoiceNo', className: 'font-mono text-xs font-semibold text-slate-500' },
    { label: 'Date', key: 'createdAt', render: (val) => formatDateTime(val), className: 'text-xs text-slate-500' },
    { label: 'Customer', key: 'customerName', className: 'font-bold' },
    { label: 'Payment', key: 'paymentMethod', render: (val) => (val || 'cash').toUpperCase(), className: 'text-xs font-medium' },
    { label: 'Total Paid', key: 'total', render: (val) => formatCurrency(val), className: 'font-bold' },
    {
      label: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewInvoice(row)}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <FiFileText /> View Receipt
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => navigate('/sales/pos')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-1 flex items-center gap-2 ${
            activeTab === 'pos'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FiShoppingCart /> POS billing Terminal
        </button>
        <button
          onClick={() => navigate('/sales')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-1 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FiFileText /> Sales History / Invoices
        </button>
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left panel: Product Selector */}
          <div className="lg:col-span-3 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Input
                  ref={barcodeInputRef}
                  value={barcodeSearch}
                  onChange={(e) => setBarcodeSearch(e.target.value)}
                  onKeyDown={handleBarcodeScan}
                  placeholder="Scan barcode directly..."
                  size="md"
                  className="font-mono pr-8"
                  icon={
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-500 animate-pulse" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 5v14M6 5v14M10 5v14M13 5v14M18 5v14M21 5v14M16 5v14M8 5v14" />
                    </svg>
                  }
                />
              </div>
              <SearchInput
                value={posSearch}
                onChange={setPosSearch}
                onClear={() => setPosSearch('')}
                placeholder="Search products..."
              />
              <Select
                value={posCategory}
                onChange={(e) => setPosCategory(e.target.value)}
                options={categories}
                placeholder="All Categories"
              />
            </div>

            {isLoadingProducts ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 4].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No items match criteria</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-sm transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-400 font-mono tracking-tight">{p.sku}</p>
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate mt-0.5">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatCurrency(p.price)}</p>
                    </div>
                    <div className="text-right ml-4">
                      {p.stock <= 0 ? (
                        <Badge variant="danger" className="text-[9px]">Out</Badge>
                      ) : (
                        <Badge variant="success" className="text-[9px]">{p.stock} units</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: Shopping Cart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col h-[75vh] shadow-sm relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 border-b pb-3 flex items-center gap-2">
              <FiShoppingCart /> Billing Cart ({cart.length})
            </h3>

            {/* Cart items list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <AnimatePresence>
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <FiShoppingCart className="text-4xl mb-2 stroke-[1.5]" />
                    <p className="text-xs font-medium">Cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => {
                    const prod = products.find(p => p.id === item.productId);
                    const stock = prod?.stock || 0;
                    return (
                      <motion.div
                        key={item.productId}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2 relative border border-slate-200/50 dark:border-slate-800/20"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatCurrency(item.price)} each</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        </div>

                        {item.imeiRequired && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1 rounded flex items-center gap-0.5"><FiCpu /> IMEI:</span>
                            <Select
                              value={item.imei}
                              onChange={(e) => updateCartImei(item.productId, e.target.value)}
                              options={item.imeiList}
                              placeholder="-- Select IMEI --"
                              className="py-0.5 text-xs flex-1"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-200/40 dark:border-slate-800/20 pt-2">
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0">
                            <button
                              onClick={() => updateCartQty(item.productId, -1, stock)}
                              className="p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <FiMinus className="text-[10px]" />
                            </button>
                            <span className="px-3 text-xs font-bold">{item.qty}</span>
                            <button
                              onClick={() => updateCartQty(item.productId, 1, stock)}
                              className="p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <FiPlus className="text-[10px]" />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatCurrency(item.price * item.qty)}</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Cart summary */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Customer Phone"
                  placeholder="e.g. 9876543210"
                  size="sm"
                  value={customerPhone}
                  onChange={(e) => {
                    const phone = e.target.value;
                    setCustomerPhone(phone);
                    const found = customers.find(c => c.phone === phone);
                    if (found) setCustomerName(found.name);
                  }}
                />
                <Input
                  label="Customer Name"
                  placeholder="Walk-in Customer"
                  size="sm"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Discount Value (₹)"
                  type="number"
                  placeholder="0"
                  size="sm"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
                <Select
                  label="Payment Method"
                  options={PAYMENT_METHODS}
                  size="sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>

              <div className="space-y-1 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST Taxes (18%):</span>
                  <span>{formatCurrency(cartTax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Discount:</span>
                    <span>-{formatCurrency(cartDiscountVal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-800 dark:text-slate-100 pt-1">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                fullWidth
                className="rounded-xl h-11 text-xs font-bold"
                onClick={handleCheckout}
                loading={checkoutMutation.isPending}
                disabled={cart.length === 0}
              >
                Checkout & Print Invoice
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <TableCard
          columns={salesColumns}
          data={sales}
          loading={isLoadingSales}
          emptyTitle="No invoices recorded"
          onRowClick={(row) => setViewInvoice(row)}
        />
      )}

      {/* Checkout Receipt Invoice Modal */}
      <Modal isOpen={!!checkoutResult} onClose={() => setCheckoutResult(null)} title="Checkout Success Receipt" size="md">
        {checkoutResult && (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                <FiCheck className="text-2xl" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Transaction Finalized</h3>
              <p className="text-xs text-slate-400 mt-1">Invoice number: {checkoutResult.invoiceNo}</p>
            </div>

            <InvoicePrintable invoice={checkoutResult} />

            <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="secondary" className="rounded-xl flex items-center gap-1.5" onClick={() => window.print()}>
                <FiPrinter /> Print Receipt
              </Button>
              <Button variant="primary" className="rounded-xl" onClick={() => setCheckoutResult(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Selected Invoice Modal */}
      <Modal isOpen={!!viewInvoice} onClose={() => setViewInvoice(null)} title="POS Invoice Details" size="md">
        {viewInvoice && (
          <div className="p-6 space-y-6">
            <InvoicePrintable invoice={viewInvoice} />

            <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="secondary" className="rounded-xl flex items-center gap-1.5" onClick={() => window.print()}>
                <FiPrinter /> Print Receipt
              </Button>
              <Button variant="primary" className="rounded-xl" onClick={() => setViewInvoice(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Printable invoice template sub-component
const InvoicePrintable = ({ invoice }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/30 text-slate-800 dark:text-slate-200">
    <div className="flex justify-between items-start border-b border-slate-200/50 dark:border-slate-800/30 pb-3 mb-4">
      <div>
        <p className="text-sm font-extrabold tracking-tight">Galaxy POS Shop</p>
        <p className="text-[9px] text-slate-400 mt-0.5">102 Tech Plaza, Sector-18, Noida</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">GST TAX INVOICE</p>
        <p className="text-[9px] text-slate-400 mt-0.5">{formatDateTime(invoice.createdAt)}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 text-xs mb-4">
      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase">Customer Details</p>
        <p className="font-semibold mt-0.5">{invoice.customerName || 'Walk-in Customer'}</p>
        {invoice.customerPhone && <p className="text-slate-500 font-mono">{invoice.customerPhone}</p>}
      </div>
      <div className="text-right">
        <p className="text-[10px] text-slate-400 font-bold uppercase">Invoice References</p>
        <p className="font-mono mt-0.5">{invoice.invoiceNo}</p>
        <p className="text-slate-500">Method: {(invoice.paymentMethod || 'cash').toUpperCase()}</p>
      </div>
    </div>

    <div className="space-y-2 border-b border-slate-200/50 dark:border-slate-800/30 pb-3 mb-3">
      <div className="grid grid-cols-5 text-[9px] font-bold text-slate-400 uppercase">
        <span className="col-span-3">Item Description</span>
        <span className="text-center">Qty</span>
        <span className="text-right">Amount</span>
      </div>

      {invoice.items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-5 text-xs">
          <div className="col-span-3 min-w-0">
            <p className="font-semibold truncate">{item.name}</p>
            {item.imei && <p className="text-[9px] text-blue-600 dark:text-blue-400 font-mono">IMEI: {item.imei}</p>}
          </div>
          <span className="text-center">{item.qty}</span>
          <span className="text-right font-semibold">{formatCurrency(item.price * item.qty)}</span>
        </div>
      ))}
    </div>

    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(invoice.subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>Taxes (18%):</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(invoice.tax)}</span>
      </div>
      {invoice.discount > 0 && (
        <div className="flex justify-between text-red-500">
          <span>Discount Applied:</span>
          <span>-{formatCurrency(invoice.discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-black text-slate-800 dark:text-slate-100 border-t border-slate-200/40 dark:border-slate-800/20 pt-1.5 mt-1">
        <span>Grand Total Amount:</span>
        <span>{formatCurrency(invoice.total)}</span>
      </div>
    </div>
  </div>
);

export default Sales;
