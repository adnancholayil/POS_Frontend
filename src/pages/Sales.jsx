import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiShoppingCart, FiSearch, FiTrash2, FiUser,
  FiFileText, FiRepeat, FiCheck, FiPrinter, FiPlus, FiMinus, FiCpu, FiBox,
  FiCreditCard, FiSmartphone, FiDollarSign, FiSend
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

// Formats the invoice text message for WhatsApp sharing
const buildWhatsAppMessage = (invoice, shopName = 'POS Shop') => {
  const subtotal = Number(invoice.subtotal) || 0;
  const tax = Number(invoice.tax) || 0;
  const discount = Number(invoice.discount) || 0;
  const total = Number(invoice.total) || 0;

  let msg = `*${shopName.toUpperCase()} - TAX INVOICE*\n`;
  msg += `*Invoice No:* ${invoice.invoiceNo}\n`;
  msg += `*Date:* ${new Date(invoice.createdAt).toLocaleString()}\n`;
  msg += `*Customer:* ${invoice.customerName || 'Walk-in Customer'}\n`;
  msg += `*Payment Method:* ${(invoice.paymentMethod || 'cash').toUpperCase()}\n`;
  msg += `---------------------------\n`;
  msg += `*Items:*\n`;
  
  invoice.items.forEach((item, idx) => {
    msg += `${idx + 1}. *${item.name}*\n`;
    if (item.imei) {
      msg += `   IMEI: _${item.imei}_\n`;
    }
    msg += `   Qty: ${item.qty} | Price: ₹${item.price} | Total: ₹${item.price * item.qty}\n`;
  });
  
  msg += `---------------------------\n`;
  msg += `*Subtotal:* ₹${subtotal.toFixed(2)}\n`;
  msg += `*GST Tax:* ₹${tax.toFixed(2)}\n`;
  if (discount > 0) {
    msg += `*Discount Applied:* -₹${discount.toFixed(2)}\n`;
  }
  msg += `*Grand Total: ₹${total.toFixed(2)}*\n\n`;
  msg += `Thank you for shopping with us!`;
  
  return encodeURIComponent(msg);
};

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

  React.useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
          barcodeInputRef.current.select();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // POS State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('walk-in');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percent'
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Checkout Receipt Modal
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [activePrintInvoice, setActivePrintInvoice] = useState(null);

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

  const { data: shopSettings } = useQuery({
    queryKey: ['shopSettings'],
    queryFn: () => settingsApi.getShop().then(res => res.data),
  });

  // Automatically trigger printing when print state is set
  useEffect(() => {
    if (activePrintInvoice) {
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error('Print trigger failed:', err);
        } finally {
          setActivePrintInvoice(null);
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activePrintInvoice]);

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: (data) => salesApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      addToast('Transaction checkout completed successfully', 'success');
      
      const responseBody = res.data;
      const saleHeader = responseBody?.data?.sale || responseBody?.sale || {};
      
      const mappedInvoice = {
        id: saleHeader._id || saleHeader.id,
        invoiceNo: saleHeader.invoiceNumber || responseBody?.data?.invoiceNumber || 'INV-TEMP',
        createdAt: saleHeader.createdAt || new Date().toISOString(),
        customerName: saleHeader.customerName || customerName,
        customerPhone: customerPhone || '',
        paymentMethod: saleHeader.paymentMethod || paymentMethod,
        subtotal: saleHeader.subTotal !== undefined ? saleHeader.subTotal : cartSubtotal,
        tax: saleHeader.taxAmount !== undefined ? saleHeader.taxAmount : cartTax,
        discount: saleHeader.discountAmount !== undefined ? saleHeader.discountAmount : cartDiscountVal,
        total: saleHeader.totalAmount !== undefined ? saleHeader.totalAmount : cartTotal,
        items: cart.map(it => ({
          productId: it.productId,
          name: it.name,
          price: it.price,
          qty: it.qty,
          imei: it.imei || ''
        }))
      };

      const printType = shopSettings?.printType || 'thermal';
      if (printType === 'whatsapp') {
        const phone = customerPhone ? customerPhone.replace(/\D/g, '') : '';
        const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
        const msgText = buildWhatsAppMessage(mappedInvoice, shopSettings?.name);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${msgText}`;
        window.open(whatsappUrl, '_blank');
      } else {
        setActivePrintInvoice(mappedInvoice);
      }

      setCart([]);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setSelectedCustomerId('walk-in');
      setDiscount(0);
      setDiscountType('flat');
    },
    onError: () => addToast('Checkout processing failed', 'error'),
  });

  // POS CART ACTIONS
  const addToCart = (product) => {
    if (product.stock <= 0) {
      addToast('Item is out of stock', 'warning');
      return;
    }

    const defaultTax = shopSettings?.defaultTaxRate !== undefined ? shopSettings.defaultTaxRate : 18;

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
        taxRate: product.taxRate !== undefined ? product.taxRate : defaultTax,
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

  const updateCartQtyVal = (productId, newQty) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        return { ...item, qty: newQty };
      }
      return item;
    }));
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
  const defaultTax = shopSettings?.defaultTaxRate !== undefined ? shopSettings.defaultTaxRate : 18;
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  let cartTax = 0;
  let cartDiscountVal = 0;

  if (discountType === 'percent') {
    cart.forEach(item => {
      const itemSubtotal = item.price * item.qty;
      const itemTaxRate = item.taxRate !== undefined ? item.taxRate : defaultTax;
      const itemDiscount = itemSubtotal * (discount / 100);
      const itemTaxable = Math.max(0, itemSubtotal - itemDiscount);
      const itemTax = itemTaxable * (itemTaxRate / 100);
      cartTax += itemTax;
    });
    cartDiscountVal = +(cartSubtotal * (discount / 100)).toFixed(2);
    cartTax = +cartTax.toFixed(2);
  } else {
    cart.forEach(item => {
      const itemSubtotal = item.price * item.qty;
      const itemTaxRate = item.taxRate !== undefined ? item.taxRate : defaultTax;
      const itemTax = itemSubtotal * (itemTaxRate / 100);
      cartTax += itemTax;
    });
    cartDiscountVal = discount;
    cartTax = +cartTax.toFixed(2);
  }

  const cartTotal = Math.max(0, +(cartSubtotal + cartTax - cartDiscountVal).toFixed(2));

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
      items: cart.map(it => {
        const itemSubtotal = it.price * it.qty;
        const itemTaxRate = it.taxRate !== undefined ? it.taxRate : defaultTax;
        
        let itemDiscount = 0;
        if (discountType === 'percent') {
          itemDiscount = itemSubtotal * (discount / 100);
        } else if (discountType === 'flat' && cartSubtotal > 0) {
          itemDiscount = (itemSubtotal / cartSubtotal) * (discount / (1 + itemTaxRate / 100));
        }

        const itemTaxable = Math.max(0, itemSubtotal - itemDiscount);
        const itemTax = itemTaxable * (itemTaxRate / 100);
        const itemTotal = itemTaxable + itemTax;

        return {
          productId: it.productId,
          name: it.name,
          price: it.price,
          qty: it.qty,
          taxRate: itemTaxRate,
          discountAmount: +itemDiscount.toFixed(2),
          taxAmount: +itemTax.toFixed(2),
          totalPrice: +itemTotal.toFixed(2),
          imei: it.imei
        };
      }),
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Product Selector */}
          <div className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Input
                  ref={barcodeInputRef}
                  value={barcodeSearch}
                  onChange={(e) => setBarcodeSearch(e.target.value)}
                  onKeyDown={handleBarcodeScan}
                  placeholder="Scan barcode... (Ctrl+B)"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No items match criteria</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1 pb-4">
                {filteredProducts.map(p => {
                  const backendBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
                  const imageUrl = p.image ? `${backendBaseUrl}${p.image}` : null;
                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3.5 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group min-w-0"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-800 shrink-0 overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '';
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <FiBox className="text-lg text-slate-400 dark:text-slate-600 stroke-[1.5]" />
                        )}
                      </div>
                      
                      {/* Info Details */}
                      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                        <p className="text-xs font-bold text-slate-400 font-mono tracking-tight truncate leading-none">{p.sku}</p>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate leading-tight group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mt-1 mb-1.5" title={p.name}>
                          {p.name}
                        </p>
                        <div className="flex items-center justify-between leading-none">
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">{formatCurrency(p.price)}</span>
                          {p.stock <= 0 ? (
                            <span className="text-[9px] text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">Out</span>
                          ) : (
                            <span className="text-[9px] text-green-500 font-bold bg-green-500/10 px-1.5 py-0.5 rounded">{p.stock} units</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel: Shopping Cart */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-[85vh] shadow-sm relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2.5 border-b pb-2 flex items-center gap-2">
              <FiShoppingCart /> Billing Cart ({cart.length})
            </h3>

            {/* Cart items list */}
            <div className="flex-1 min-h-[180px] overflow-y-auto space-y-1 pr-1 font-sans">
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
                        className="flex flex-col gap-1.5 py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                      >
                        <div className="flex items-center justify-between gap-2.5 text-slate-800 dark:text-slate-200">
                          {/* Left: Delete & Name */}
                          <div className="min-w-0 flex-1 flex items-center gap-1.5">
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-red-400 hover:text-red-600 transition-colors shrink-0 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                              title="Remove"
                            >
                              <FiTrash2 className="text-xs" />
                            </button>
                            <span className="text-xs font-bold truncate leading-tight dark:text-slate-100" title={item.name}>
                              {item.name}
                            </span>
                          </div>

                          {/* Center: Qty adjusting (Typable) */}
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden shrink-0 h-6.5">
                            <button
                              onClick={() => updateCartQty(item.productId, -1, stock)}
                              className="px-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 h-full flex items-center justify-center"
                            >
                              <FiMinus className="text-[10px]" />
                            </button>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                  if (val > stock) {
                                    addToast('Cannot exceed physical stock limits', 'warning');
                                    updateCartQtyVal(item.productId, stock);
                                  } else if (val >= 1) {
                                    updateCartQtyVal(item.productId, val);
                                  }
                                } else {
                                  updateCartQtyVal(item.productId, '');
                                }
                              }}
                              onBlur={(e) => {
                                let val = parseInt(e.target.value) || 1;
                                if (val > stock) val = stock;
                                if (val < 1) val = 1;
                                updateCartQtyVal(item.productId, val);
                              }}
                              className="w-9 text-center text-xs font-bold bg-transparent border-0 outline-none p-0 focus:outline-none focus:ring-0 focus:border-0"
                            />
                            <button
                              onClick={() => updateCartQty(item.productId, 1, stock)}
                              className="px-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 h-full flex items-center justify-center"
                            >
                              <FiPlus className="text-[10px]" />
                            </button>
                          </div>

                          {/* Right: Total Price */}
                          <div className="text-right shrink-0 min-w-[70px]">
                            <span className="text-xs font-extrabold dark:text-slate-200">{formatCurrency(item.price * item.qty)}</span>
                            <p className="text-[9px] text-slate-400 font-mono -mt-0.5">{formatCurrency(item.price)} each</p>
                          </div>
                        </div>

                        {/* Optional IMEI Dropdown (fits nested underneath) */}
                        {item.imeiRequired && (
                          <div className="flex items-center gap-2 pl-6 pr-1 mt-0.5">
                            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded flex items-center gap-0.5 shrink-0"><FiCpu /> IMEI:</span>
                            <Select
                              value={item.imei}
                              onChange={(e) => updateCartImei(item.productId, e.target.value)}
                              options={item.imeiList}
                              placeholder="-- Select IMEI --"
                              className="py-0 px-1.5 text-[10px] h-6 min-h-0 flex-1 bg-transparent border-slate-200 dark:border-slate-800"
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Cart summary */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-auto space-y-2">
              {/* Customer Selection and details */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/20 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Customer Details</span>
                  <Select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCustomerId(val);
                      if (val === 'walk-in') {
                        setCustomerName('Walk-in Customer');
                        setCustomerPhone('');
                      } else {
                        const found = customers.find(c => c.id === val);
                        if (found) {
                          setCustomerName(found.name);
                          setCustomerPhone(found.phone);
                        }
                      }
                    }}
                    options={[
                      { value: 'walk-in', label: 'Walk-in Customer (Default)' },
                      ...customers.map(c => ({ value: c.id, label: `${c.name} (${c.phone})` }))
                    ]}
                    className="py-1 text-xs max-w-[220px]"
                  />
                </div>

                {selectedCustomerId === 'walk-in' ? (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-800/20">
                    <Input
                      placeholder="Customer Name"
                      size="sm"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <Input
                      placeholder="Customer Phone"
                      size="sm"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-blue-500/5 border border-blue-500/10 rounded-lg p-2 text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                    <div className="flex items-center gap-1.5">
                      <FiUser />
                      <span>{customerName}</span>
                      <span className="text-slate-400 font-normal">({customerPhone || 'No Phone'})</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCustomerId('walk-in');
                        setCustomerName('Walk-in Customer');
                        setCustomerPhone('');
                      }}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Discount and Payment Grid */}
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Discount ({discountType === 'flat' ? '₹' : '%'})
                    </label>
                    <div className="flex items-center gap-1">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          placeholder="0"
                          size="sm"
                          value={discount || ''}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val === '') {
                              setDiscount(0);
                            } else {
                              let num = Number(val);
                              if (num < 0) num = 0;
                              if (discountType === 'percent' && num > 100) num = 100;
                              setDiscount(num);
                            }
                          }}
                          className="h-8 pr-1 font-mono"
                        />
                      </div>
                      <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0 h-8">
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountType('flat');
                            setDiscount(0);
                          }}
                          className={`px-2 transition-all text-xs font-bold cursor-pointer ${
                            discountType === 'flat'
                              ? 'bg-blue-600 text-white font-black'
                              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title="Flat Discount (₹)"
                        >
                          ₹
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountType('percent');
                            setDiscount(0);
                          }}
                          className={`px-2 transition-all text-xs font-bold cursor-pointer ${
                            discountType === 'percent'
                              ? 'bg-blue-600 text-white font-black'
                              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title="Percentage Discount (%)"
                        >
                          %
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-7">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-5 gap-1 flex-1">
                      {PAYMENT_METHODS.map(pm => {
                        const isActive = paymentMethod === pm.value;
                        return (
                          <button
                            key={pm.value}
                            type="button"
                            onClick={() => setPaymentMethod(pm.value)}
                            className={`py-1 px-0.5 rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 h-9 ${
                              isActive
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm font-black'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 font-semibold'
                            }`}
                          >
                            {pm.value === 'cash' && <FiDollarSign className="text-xs shrink-0" />}
                            {pm.value === 'card' && <FiCreditCard className="text-xs shrink-0" />}
                            {pm.value === 'upi' && <FiSmartphone className="text-xs shrink-0" />}
                            {pm.value === 'bank' && <FiSend className="text-xs shrink-0" />}
                            {pm.value === 'credit' && <FiUser className="text-xs shrink-0" />}
                            <span className="text-[8px] truncate w-full text-center leading-none mt-0.5">{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Polished Invoice Totals Box */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/20 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST Taxes:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(cartTax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Discount:</span>
                    <span>-{formatCurrency(cartDiscountVal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-800 dark:text-slate-100 border-t border-slate-200/40 dark:border-slate-800/20 pt-1.5 mt-0.5">
                  <span>Total Amount:</span>
                  <span className="text-blue-600 dark:text-blue-400">{formatCurrency(cartTotal)}</span>
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

            <InvoicePrintable invoice={checkoutResult} printType={shopSettings?.printType} shopSettings={shopSettings} />

            <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button
                variant="secondary"
                className="rounded-xl flex items-center gap-1.5"
                onClick={() => {
                  const phone = checkoutResult.customerPhone ? checkoutResult.customerPhone.replace(/\D/g, '') : '';
                  const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
                  const msgText = buildWhatsAppMessage(checkoutResult, shopSettings?.name);
                  const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${msgText}`;
                  window.open(whatsappUrl, '_blank');
                }}
              >
                <FiSend /> WhatsApp Share
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl flex items-center gap-1.5"
                onClick={() => setActivePrintInvoice(checkoutResult)}
              >
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
            <InvoicePrintable invoice={viewInvoice} printType={shopSettings?.printType} shopSettings={shopSettings} />

            <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button
                variant="secondary"
                className="rounded-xl flex items-center gap-1.5"
                onClick={() => {
                  const phone = viewInvoice.customerPhone ? viewInvoice.customerPhone.replace(/\D/g, '') : '';
                  const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
                  const msgText = buildWhatsAppMessage(viewInvoice, shopSettings?.name);
                  const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${msgText}`;
                  window.open(whatsappUrl, '_blank');
                }}
              >
                <FiSend /> WhatsApp Share
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl flex items-center gap-1.5"
                onClick={() => setActivePrintInvoice(viewInvoice)}
              >
                <FiPrinter /> Print Receipt
              </Button>
              <Button variant="primary" className="rounded-xl" onClick={() => setViewInvoice(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden Print Area */}
      {activePrintInvoice && (
        <div className={`print-only-section format-${shopSettings?.printType || 'thermal'}`}>
          <InvoicePrintable
            invoice={activePrintInvoice}
            printType={shopSettings?.printType || 'thermal'}
            shopSettings={shopSettings}
          />
        </div>
      )}
    </div>
  );
};

// Printable invoice template sub-component
const InvoicePrintable = ({ invoice, printType = 'thermal', shopSettings }) => {
  const isThermal = printType === 'thermal';
  const name = shopSettings?.name || 'Galaxy POS Shop';
  const address = shopSettings?.address || '102 Tech Plaza, Sector-18, Noida';
  const phone = shopSettings?.phone || '';
  const email = shopSettings?.email || '';
  const gstin = shopSettings?.gstin || '';
  const terms = shopSettings?.terms || '';

  if (isThermal) {
    return (
      <div className="receipt-thermal p-2 text-slate-900 bg-white font-mono text-[10px] leading-tight max-w-[80mm] mx-auto">
        {/* Header */}
        <div className="text-center space-y-1 mb-2">
          <p className="text-xs font-black uppercase tracking-tight">{name}</p>
          {address && <p className="text-[9px] text-slate-600">{address}</p>}
          {(phone || email) && (
            <p className="text-[9px] text-slate-500">
              {phone && `Ph: ${phone}`} {email && ` | ${email}`}
            </p>
          )}
          {gstin && <p className="text-[9px] font-bold text-slate-700">GSTIN: {gstin}</p>}
          <div className="border-b border-dashed border-slate-300 my-1.5" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest">GST RETAIL INVOICE</p>
          <div className="border-b border-dashed border-slate-300 my-1.5" />
        </div>

        {/* Invoice Info */}
        <div className="space-y-0.5 mb-2">
          <p><span className="font-bold">Invoice:</span> {invoice.invoiceNo}</p>
          <p><span className="font-bold">Date:</span> {formatDateTime(invoice.createdAt)}</p>
          <p><span className="font-bold">Customer:</span> {invoice.customerName || 'Walk-in Customer'}</p>
          {invoice.customerPhone && <p><span className="font-bold">Phone:</span> {invoice.customerPhone}</p>}
          <p><span className="font-bold">Payment:</span> {(invoice.paymentMethod || 'cash').toUpperCase()}</p>
        </div>
        <div className="border-b border-dashed border-slate-300 my-1.5" />

        {/* Item List */}
        <div className="space-y-1 mb-2">
          <div className="flex justify-between font-bold text-[9px] uppercase">
            <span className="w-1/2 text-left">Item Description</span>
            <span className="w-1/6 text-center">Qty</span>
            <span className="w-1/3 text-right">Price</span>
          </div>
          <div className="border-b border-dashed border-slate-200 my-1" />
          {invoice.items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between">
                <span className="w-1/2 font-semibold truncate">{item.name}</span>
                <span className="w-1/6 text-center">{item.qty}</span>
                <span className="w-1/3 text-right">{formatCurrency(item.price * item.qty)}</span>
              </div>
              {item.imei && <p className="text-[8px] text-slate-500 pl-2">IMEI: {item.imei}</p>}
            </div>
          ))}
        </div>
        <div className="border-b border-dashed border-slate-300 my-1.5" />

        {/* Totals */}
        <div className="space-y-1 text-right mb-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST Taxes:</span>
            <span>{formatCurrency(invoice.tax)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount:</span>
              <span>-{formatCurrency(invoice.discount)}</span>
            </div>
          )}
          <div className="border-b border-dashed border-slate-200 my-1" />
          <div className="flex justify-between font-black text-xs">
            <span>GRAND TOTAL:</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
        <div className="border-b border-dashed border-slate-300 my-1.5" />

        {/* Footer */}
        <div className="text-center space-y-1 text-[8px] text-slate-500">
          {terms ? (
            <p className="whitespace-pre-line leading-tight">{terms}</p>
          ) : (
            <p>Thank you for shopping with us!</p>
          )}
          <p className="font-bold text-[9px] pt-1">*** Duplicate Copy ***</p>
        </div>
      </div>
    );
  }

  // A4 layout (standard formal professional layout)
  return (
    <div className="receipt-a4 p-8 bg-white text-slate-900 border border-slate-100 rounded-xl max-w-[800px] mx-auto text-xs leading-normal">
      {/* Invoice Header */}
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">{name}</h1>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xs whitespace-pre-line">{address}</p>
          <div className="text-[11px] text-slate-400 mt-2 space-y-0.5">
            {phone && <p>Phone: {phone}</p>}
            {email && <p>Email: {email}</p>}
            {gstin && <p className="font-bold text-slate-700 mt-1">GSTIN: {gstin}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-blue-600 uppercase tracking-wide">TAX INVOICE</h2>
          <div className="mt-4 space-y-1 font-mono text-[11px]">
            <p><span className="text-slate-400 uppercase font-sans font-semibold">Invoice No:</span> {invoice.invoiceNo}</p>
            <p><span className="text-slate-400 uppercase font-sans font-semibold">Date:</span> {formatDateTime(invoice.createdAt)}</p>
            <p><span className="text-slate-400 uppercase font-sans font-semibold">Payment:</span> {(invoice.paymentMethod || 'cash').toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Bill To & Info */}
      <div className="grid grid-cols-2 gap-8 bg-slate-50 p-4 rounded-xl mb-6">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Customer / Billed To:</h3>
          <p className="text-sm font-bold text-slate-800">{invoice.customerName || 'Walk-in Customer'}</p>
          {invoice.customerPhone && (
            <p className="text-xs text-slate-500 font-mono mt-1">Mobile: {invoice.customerPhone}</p>
          )}
        </div>
        <div className="text-right">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">POS Checkout Operator:</h3>
          <p className="text-xs font-semibold text-slate-700">Cashier Counter 01</p>
          <p className="text-[10px] text-slate-400 mt-1">Authorized Store Sales</p>
        </div>
      </div>

      {/* Invoice Items Table */}
      <table className="w-full text-left border-collapse mb-6">
        <thead>
          <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <th className="py-2.5 w-10 text-center">#</th>
            <th className="py-2.5 pl-2">Item Name & Serial Description</th>
            <th className="py-2.5 text-center w-20">Rate</th>
            <th className="py-2.5 text-center w-16">Qty</th>
            <th className="py-2.5 text-right w-28 pr-2">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoice.items.map((item, idx) => (
            <tr key={idx} className="text-xs text-slate-800">
              <td className="py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
              <td className="py-3 pl-2">
                <span className="font-bold">{item.name}</span>
                {item.imei && (
                  <span className="block text-[10px] text-blue-600 font-mono mt-0.5">IMEI/Serial: {item.imei}</span>
                )}
              </td>
              <td className="py-3 text-center font-mono">{formatCurrency(item.price)}</td>
              <td className="py-3 text-center">{item.qty}</td>
              <td className="py-3 text-right font-mono pr-2">{formatCurrency(item.price * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Invoice Summary Blocks */}
      <div className="flex justify-between items-start border-t border-slate-200 pt-6">
        {/* Terms & Disclaimers */}
        <div className="w-1/2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Terms & Disclaimers</h3>
          {terms ? (
            <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed pr-6">{terms}</p>
          ) : (
            <p className="text-[10px] text-slate-400 italic">No custom disclaimers attached. Goods once sold cannot be returned.</p>
          )}
        </div>

        {/* Grand Calculations */}
        <div className="w-1/3 text-xs text-slate-600 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal Value:</span>
            <span className="font-mono text-slate-800 font-semibold">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST Tax Value:</span>
            <span className="font-mono text-slate-800 font-semibold">{formatCurrency(invoice.tax)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Discount Value:</span>
              <span className="font-mono font-semibold">-{formatCurrency(invoice.discount)}</span>
            </div>
          )}
          <div className="border-b border-slate-200 my-1" />
          <div className="flex justify-between text-sm font-black text-slate-800">
            <span>Grand Total Due:</span>
            <span className="font-mono text-blue-600">{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-12 pt-8 flex justify-between items-end border-t border-dashed border-slate-200">
        <div className="text-slate-400 text-[10px]">
          <p>Thank you for your valuable business!</p>
          <p className="mt-1 font-mono text-[9px]">Generated on POS Terminal #1 via cloud sync.</p>
        </div>
        <div className="text-right w-44">
          <div className="h-10 border-b border-slate-200" />
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mt-2">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
};

export default Sales;
