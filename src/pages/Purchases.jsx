import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage, FiSearch, FiTrash2, FiPlus, FiMinus,
  FiTruck, FiClock, FiUsers, FiPrinter,
  FiEdit2, FiCheck, FiX, FiShoppingBag, FiCpu,
  FiAlertCircle, FiFolder, FiTag,
} from 'react-icons/fi';
import { productApi, settingsApi, supplierApi, purchaseApi } from '../api/services';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input, Select, Checkbox } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { PAYMENT_METHODS } from '../utils/constants';

// ─── Thermal (80mm) Print Template ───────────────────────────────────────────
const ThermalPrint = ({ po, shopSettings }) => {
  if (!po) return null;
  const items = po.items || [];
  const total = Number(po.total || 0);
  return (
    <div className="pos-print-section" style={{ fontFamily: 'monospace', fontSize: '12px', color: '#000', background: '#fff', padding: '4mm', width: '76mm', margin: '0 auto' }}>
      {/* Shop Header */}
      <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
        <div style={{ fontWeight: 900, fontSize: '16px', letterSpacing: '0.5px' }}>{shopSettings?.name || 'Galaxy POS'}</div>
        {shopSettings?.address && <div style={{ fontSize: '9px', marginTop: '1mm' }}>{shopSettings.address}</div>}
        {shopSettings?.phone && <div style={{ fontSize: '9px' }}>📞 {shopSettings.phone}</div>}
        {shopSettings?.gstin && <div style={{ fontSize: '9px' }}>GSTIN: {shopSettings.gstin}</div>}
      </div>
      <div style={{ borderTop: '2px dashed #000', margin: '2mm 0' }} />
      <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '13px', letterSpacing: '2px', marginBottom: '2mm' }}>PURCHASE ORDER</div>
      <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }} />
      {/* PO Details */}
      <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><b>PO #:</b></span><span style={{ fontWeight: 700 }}>{po.poNumber}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><b>Date:</b></span><span>{formatDateTime(po.date)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><b>Supplier:</b></span><span>{po.supplierName || 'N/A'}</span></div>
        {po.supplierPhone && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><b>Phone:</b></span><span>{po.supplierPhone}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><b>Status:</b></span><span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{po.status?.replace('_', ' ')}</span></div>
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }} />
      {/* Items */}
      <div style={{ fontSize: '10px' }}>
        <div style={{ display: 'flex', fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: '1mm', marginBottom: '1mm' }}>
          <span style={{ flex: 1 }}>Item</span>
          <span style={{ width: '30px', textAlign: 'center' }}>Qty</span>
          <span style={{ width: '45px', textAlign: 'right' }}>Rate</span>
          <span style={{ width: '50px', textAlign: 'right' }}>Amt</span>
        </div>
        {items.map((item, i) => (
          <div key={i} style={{ marginBottom: '1.5mm' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <span style={{ flex: 1, fontWeight: 600, lineHeight: '1.3' }}>{item.name || item.productName}</span>
              <span style={{ width: '30px', textAlign: 'center' }}>{item.qty}</span>
              <span style={{ width: '45px', textAlign: 'right' }}>₹{Number(item.unitCost).toFixed(0)}</span>
              <span style={{ width: '50px', textAlign: 'right', fontWeight: 700 }}>₹{(item.qty * item.unitCost).toFixed(0)}</span>
            </div>
            {item.sku && <div style={{ color: '#666', fontSize: '9px', paddingLeft: '2px' }}>SKU: {item.sku}</div>}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '2px dashed #000', margin: '2mm 0' }} />
      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '14px' }}>
        <span>GRAND TOTAL</span>
        <span>₹{total.toFixed(2)}</span>
      </div>
      {po.notes && <div style={{ marginTop: '2mm', fontSize: '9px', color: '#555', borderTop: '1px dashed #ccc', paddingTop: '1.5mm' }}>Note: {po.notes}</div>}
      <div style={{ textAlign: 'center', marginTop: '4mm', fontSize: '9px', borderTop: '1px dashed #000', paddingTop: '2mm', lineHeight: '1.5' }}>
        <div>✓ Goods Received Successfully</div>
        <div style={{ marginTop: '1mm', color: '#555' }}>Powered by Galaxy POS</div>
      </div>
    </div>
  );
};

// ─── A4 Print Template ────────────────────────────────────────────────────────
const A4Print = ({ po, shopSettings }) => {
  if (!po) return null;
  const items = po.items || [];
  const total = Number(po.total || 0);
  return (
    <div className="pos-print-section" style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#111', background: '#fff', padding: '15mm 20mm', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8mm', paddingBottom: '5mm', borderBottom: '2px solid #333' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#1a1a2e' }}>{shopSettings?.name || 'Galaxy POS'}</div>
          {shopSettings?.address && <div style={{ fontSize: '11px', color: '#555', marginTop: '1mm' }}>{shopSettings.address}</div>}
          {shopSettings?.phone && <div style={{ fontSize: '11px', color: '#555' }}>📞 {shopSettings.phone}</div>}
          {shopSettings?.email && <div style={{ fontSize: '11px', color: '#555' }}>✉ {shopSettings.email}</div>}
          {shopSettings?.gstin && <div style={{ fontSize: '11px', color: '#555' }}>GSTIN: {shopSettings.gstin}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#6d28d9', letterSpacing: '1px' }}>PURCHASE ORDER</div>
          <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2mm' }}>#{po.poNumber}</div>
          <div style={{ fontSize: '11px', color: '#555', marginTop: '1mm' }}>Date: {formatDateTime(po.date)}</div>
          <div style={{ marginTop: '2mm', display: 'inline-block', background: po.status === 'received' ? '#d1fae5' : '#fef3c7', color: po.status === 'received' ? '#065f46' : '#92400e', padding: '1mm 3mm', borderRadius: '3px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
            {po.status?.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Supplier Info */}
      <div style={{ marginBottom: '8mm' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2mm' }}>Supplier Details</div>
        <div style={{ background: '#f8f8f8', padding: '4mm', borderRadius: '3mm', border: '1px solid #e5e5e5' }}>
          <div style={{ fontWeight: 700, fontSize: '14px' }}>{po.supplierName || 'N/A'}</div>
          {po.supplierPhone && <div style={{ fontSize: '11px', color: '#555' }}>📞 {po.supplierPhone}</div>}
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8mm' }}>
        <thead>
          <tr style={{ background: '#6d28d9', color: '#fff' }}>
            <th style={{ padding: '3mm 4mm', textAlign: 'left', fontSize: '11px', fontWeight: 700 }}>#</th>
            <th style={{ padding: '3mm 4mm', textAlign: 'left', fontSize: '11px', fontWeight: 700 }}>Product</th>
            <th style={{ padding: '3mm 4mm', textAlign: 'left', fontSize: '11px', fontWeight: 700 }}>SKU</th>
            <th style={{ padding: '3mm 4mm', textAlign: 'center', fontSize: '11px', fontWeight: 700 }}>Qty</th>
            <th style={{ padding: '3mm 4mm', textAlign: 'right', fontSize: '11px', fontWeight: 700 }}>Unit Cost</th>
            <th style={{ padding: '3mm 4mm', textAlign: 'right', fontSize: '11px', fontWeight: 700 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ padding: '2.5mm 4mm', fontSize: '11px', color: '#888' }}>{i + 1}</td>
              <td style={{ padding: '2.5mm 4mm', fontSize: '12px', fontWeight: 600 }}>{item.name || item.productName}</td>
              <td style={{ padding: '2.5mm 4mm', fontSize: '10px', color: '#666', fontFamily: 'monospace' }}>{item.sku || '—'}</td>
              <td style={{ padding: '2.5mm 4mm', textAlign: 'center', fontWeight: 700, fontSize: '12px' }}>{item.qty}</td>
              <td style={{ padding: '2.5mm 4mm', textAlign: 'right', fontSize: '11px' }}>₹{Number(item.unitCost).toFixed(2)}</td>
              <td style={{ padding: '2.5mm 4mm', textAlign: 'right', fontWeight: 700, fontSize: '12px', color: '#6d28d9' }}>₹{(item.qty * item.unitCost).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}>
        <div style={{ width: '200px', background: '#f3f0ff', border: '2px solid #6d28d9', borderRadius: '3mm', padding: '4mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '16px', color: '#6d28d9' }}>
            <span>TOTAL</span><span>₹{total.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: '10px', color: '#888', marginTop: '1mm', textAlign: 'right' }}>{items.length} item{items.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {po.notes && (
        <div style={{ marginBottom: '6mm', padding: '3mm 4mm', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '3mm', fontSize: '11px', color: '#78350f' }}>
          <b>Notes:</b> {po.notes}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #ccc', paddingTop: '4mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '10px', color: '#888' }}>
          <div>Generated by Galaxy POS</div>
          <div>Printed: {new Date().toLocaleString()}</div>
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#555' }}>✓ Goods Received</div>
      </div>
    </div>
  );
};

// ─── Smart Print Component — picks template based on Settings ─────────────────
const PurchaseInvoicePrint = ({ po, shopSettings }) => {
  if (!po) return null;
  const printType = shopSettings?.purchasePrintType || shopSettings?.printType || 'thermal';
  if (printType === 'a4') return <A4Print po={po} shopSettings={shopSettings} />;
  return <ThermalPrint po={po} shopSettings={shopSettings} />;
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Purchases = () => {
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Tab control ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('new');
  useEffect(() => {
    if (location.pathname.endsWith('/history')) setActiveTab('history');
    else if (location.pathname.endsWith('/suppliers')) setActiveTab('suppliers');
    else setActiveTab('new');
  }, [location.pathname]);

  // ── Barcode & Product Search ──────────────────────────────────────────────
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const barcodeRef = useRef(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'new' && barcodeRef.current) {
      setTimeout(() => barcodeRef.current?.focus(), 100);
    }
  }, [activeTab]);

  // Ctrl+B shortcut
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (barcodeRef.current) { barcodeRef.current.focus(); barcodeRef.current.select(); }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ── Cart State ────────────────────────────────────────────────────────────
  const [cart, setCart] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  // ── Print ─────────────────────────────────────────────────────────────────
  const [activePrintPO, setActivePrintPO] = useState(null);
  const [viewPO, setViewPO] = useState(null);

  useEffect(() => {
    if (activePrintPO) {
      const t = setTimeout(() => {
        try { window.print(); } catch (e) { console.error(e); } finally { setActivePrintPO(null); }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [activePrintPO]);

  // ── History filters ───────────────────────────────────────────────────────
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // ── Supplier modal ────────────────────────────────────────────────────────
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteSupplierTarget, setDeleteSupplierTarget] = useState(null);
  const [supplierForm, setSupplierForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '' });

  // ── New Product modal state ───────────────────────────────────────────────
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const {
    register: registerProduct,
    handleSubmit: handleProductSubmit,
    reset: resetProductForm,
    formState: { errors: productErrors },
  } = useForm();

  // ── New Category modal state ──────────────────────────────────────────────
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // ─────────────────────────────────────────────────────────────────────────
  // ── API Queries ───────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  const { data: products = [], isLoading: loadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll().then(r => r.data),
  });

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories().then(r => r.data),
  });

  const { data: shopSettings } = useQuery({
    queryKey: ['shopSettings'],
    queryFn: () => settingsApi.getShop().then(r => r.data),
  });

  const { data: suppliersData = { data: [], pagination: {} }, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierApi.getAll({ limit: 100 }),
  });
  const suppliers = suppliersData.data || [];

  const { data: purchaseOrdersData = { data: [] }, isLoading: loadingPOs } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => purchaseApi.getAll({ limit: 200 }),
    enabled: activeTab === 'history',
  });
  const purchaseOrders = purchaseOrdersData.data || [];

  const { data: poStats } = useQuery({
    queryKey: ['poStats'],
    queryFn: () => purchaseApi.getStats(),
    select: r => r.data,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createPOMutation = useMutation({
    mutationFn: (data) => purchaseApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['poStats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      addToast(`Purchase order ${res.data?.poNumber || ''} created! Stock updated.`, 'success');
      setActivePrintPO(res.data);
      setCart([]);
      setSelectedSupplier(null);
      setSupplierSearch('');
      setNotes('');
      setPaymentMethod('cash');
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create purchase order';
      addToast(msg, 'error');
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => productApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      addToast('Product added successfully!', 'success');
      // Auto-add newly created product to cart
      const newProduct = res.data?.data || res.data;
      if (newProduct) {
        const mapped = {
          id: newProduct._id || newProduct.id,
          name: newProduct.name,
          sku: newProduct.sku || newProduct.variants?.[0]?.sku || '',
          barcode: newProduct.barcode || '',
          cost: newProduct.cost || newProduct.variants?.[0]?.costPrice || 0,
          taxRate: newProduct.taxRate !== undefined ? newProduct.taxRate : 18,
          stock: 0,
        };
        if (mapped.id) addToCart(mapped);
      }
      setIsAddProductOpen(false);
      resetProductForm();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to add product';
      addToast(msg, 'error');
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => productApi.createCategory(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      const name = res?.data?.name || newCategoryName;
      addToast(`Category "${name}" created!`, 'success');
      setNewCategoryName('');
      setIsAddCategoryOpen(false);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create category';
      addToast(msg, 'error');
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data) => supplierApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); addToast('Supplier added!', 'success'); },
    onError: (err) => addToast(err?.response?.data?.message || 'Failed to add supplier', 'error'),
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }) => supplierApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); addToast('Supplier updated!', 'success'); },
    onError: (err) => addToast(err?.response?.data?.message || 'Failed to update supplier', 'error'),
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id) => supplierApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setDeleteSupplierTarget(null); addToast('Supplier removed', 'success'); },
    onError: (err) => addToast(err?.response?.data?.message || 'Failed to delete supplier', 'error'),
  });

  // ── Filtered products ─────────────────────────────────────────────────────
  const filteredProducts = products.filter(p => {
    const q = productSearch.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q);
    const matchCat = !categoryFilter || p.category === categoryFilter;
    return matchQ && matchCat;
  });

  // ── Filtered suppliers for search ─────────────────────────────────────────
  const filteredSuppliers = suppliers.filter(s =>
    !supplierSearch || s.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return updated;
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku || '',
        barcode: product.barcode || '',
        unitCost: Number(product.cost) || 0,
        qty: 1,
        taxRate: product.taxRate !== undefined ? product.taxRate : 18,
      }];
    });
    addToast(`${product.name} added to cart`, 'success');
  }, [addToast]);

  const updateCartQty = (productId, delta) => {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const updateCartCost = (productId, val) => {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, unitCost: Number(val) || 0 } : i));
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));

  // ── Barcode scan ──────────────────────────────────────────────────────────
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;
    setBarcodeLoading(true);
    setBarcodeInput('');
    try {
      const existing = products.find(p => p.barcode === code || p.sku === code);
      if (existing) {
        addToCart(existing);
      } else {
        const res = await productApi.getByBarcode(code);
        if (res?.data) {
          addToCart(res.data);
        } else {
          addToast(`No product found for barcode: ${code}`, 'error');
        }
      }
    } catch {
      addToast(`Barcode lookup failed: ${code}`, 'error');
    } finally {
      setBarcodeLoading(false);
      barcodeRef.current?.focus();
    }
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const grandTotal = subtotal;

  // ── Submit PO ─────────────────────────────────────────────────────────────
  const handleSubmitPO = () => {
    if (cart.length === 0) { addToast('Cart is empty — add items first', 'error'); return; }
    if (!selectedSupplier) { addToast('Please select a supplier', 'error'); return; }
    createPOMutation.mutate({
      supplierId: selectedSupplier.id,
      items: cart,
      notes,
      paymentMethod,
    });
  };

  // ── New Product submit ────────────────────────────────────────────────────
  const handleCreateProduct = (data) => {
    createProductMutation.mutate({
      ...data,
      price: Number(data.price),
      cost: Number(data.cost),
      stock: Number(data.stock || 0),
      minStock: Number(data.minStock || 0),
      taxRate: Number(data.taxRate !== undefined ? data.taxRate : 18),
      imeiList: data.imeiRequired ? data.imeis?.split(',').map(i => i.trim()).filter(Boolean) : [],
    });
  };

  // ── New Category submit ───────────────────────────────────────────────────
  const handleCreateCategory = (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) { addToast('Category name is required', 'error'); return; }
    createCategoryMutation.mutate({ name });
  };

  // ── Supplier CRUD ─────────────────────────────────────────────────────────
  const handleSaveSupplier = () => {
    if (!supplierForm.name.trim()) { addToast('Supplier name is required', 'error'); return; }
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data: supplierForm }, {
        onSuccess: () => { setIsAddSupplierOpen(false); setEditingSupplier(null); }
      });
    } else {
      createSupplierMutation.mutate(supplierForm, {
        onSuccess: () => { setIsAddSupplierOpen(false); setSupplierForm({ name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '' }); }
      });
    }
  };

  const openEditSupplier = (sup) => {
    setEditingSupplier(sup);
    setSupplierForm({ name: sup.name, contactPerson: sup.contactPerson || '', phone: sup.phone || '', email: sup.email || '', address: sup.address || '', gstin: sup.gstin || '' });
    setIsAddSupplierOpen(true);
  };

  // ── History filters ───────────────────────────────────────────────────────
  const filteredHistory = purchaseOrders.filter(po => {
    const q = historySearch.toLowerCase();
    const matchQ = !q || po.poNumber?.toLowerCase().includes(q) || (po.supplierName || '').toLowerCase().includes(q);
    const poDate = new Date(po.date);
    const matchFrom = !historyDateFrom || poDate >= new Date(historyDateFrom);
    const matchTo = !historyDateTo || poDate <= new Date(historyDateTo + 'T23:59:59');
    return matchQ && matchFrom && matchTo;
  });

  // ── Status badge helper ───────────────────────────────────────────────────
  const statusColor = (s) => ({
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    ordered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    partially_received: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    received: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
  }[s] || 'bg-slate-100 text-slate-600');

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Hidden print section */}
      {/* ── Global print styles injected once ───────────────────────────── */}
      <style>{`
        @media print {
          ${
            ((shopSettings?.purchasePrintType || shopSettings?.printType) === 'a4')
              ? '@page { size: A4 portrait; margin: 10mm; }'
              : '@page { size: 80mm auto; margin: 0; }'
          }
          body * { visibility: hidden !important; }
          .pos-print-section,
          .pos-print-section * { visibility: visible !important; }
          .pos-print-section {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            z-index: 9999 !important;
            background: #fff !important;
          }
        }
      `}</style>

      {activePrintPO && (
        <PurchaseInvoicePrint po={activePrintPO} shopSettings={shopSettings} />
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FiTruck className="text-violet-500" /> Purchases
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Procure stock from suppliers, track purchase orders, manage vendor records
          </p>
        </div>
        {/* Stats */}
        <div className="flex gap-3 flex-wrap">
          <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40 rounded-xl px-4 py-2 text-center min-w-[90px]">
            <p className="text-[10px] text-violet-500 font-bold uppercase tracking-wider">Total POs</p>
            <p className="text-lg font-black text-violet-700 dark:text-violet-300">{poStats?.total ?? '—'}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-xl px-4 py-2 text-center min-w-[90px]">
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">This Month</p>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{poStats?.thisMonth ?? '—'}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-xl px-4 py-2 text-center min-w-[110px]">
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Total Value</p>
            <p className="text-base font-black text-blue-700 dark:text-blue-300">{poStats ? formatCurrency(poStats.totalValue) : '—'}</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1">
        {[
          { id: 'new', label: 'New Purchase', icon: <FiPlus />, path: '/purchases/new' },
          { id: 'history', label: 'Purchase History', icon: <FiClock />, path: '/purchases/history' },
          { id: 'suppliers', label: 'Suppliers', icon: <FiUsers />, path: '/purchases/suppliers' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: New Purchase Order                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'new' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Scanner + Products */}
          <div className="xl:col-span-2 space-y-4">
            {/* Barcode Scanner */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiCpu className="text-white text-lg" />
                <span className="text-white font-bold text-sm">Barcode Scanner</span>
                <span className="ml-auto text-white/60 text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded">Ctrl+B to focus</span>
              </div>
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <input
                  ref={barcodeRef}
                  type="text"
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode or enter manually → press Enter…"
                  className="flex-1 bg-white/15 backdrop-blur border border-white/30 rounded-xl px-4 py-2.5 text-white placeholder-white/60 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all"
                  autoComplete="off"
                  disabled={barcodeLoading}
                />
                <button
                  type="submit"
                  disabled={barcodeLoading || !barcodeInput.trim()}
                  className="px-4 py-2.5 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 disabled:opacity-50 transition-colors text-sm flex items-center gap-1.5"
                >
                  {barcodeLoading ? <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /> : <FiCheck />}
                  Add
                </button>
              </form>
            </div>

            {/* Product Search + Quick Actions */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search by name, SKU or barcode…"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition min-w-[140px]"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                </select>
                {/* Quick-add buttons */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { resetProductForm(); setIsAddProductOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                    title="Add New Product"
                  >
                    <FiPlus className="text-sm" /> New Product
                  </button>
                  <button
                    onClick={() => { setNewCategoryName(''); setIsAddCategoryOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                    title="Add New Category"
                  >
                    <FiFolder className="text-sm" /> New Category
                  </button>
                </div>
              </div>

              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                  <FiPackage className="text-4xl" />
                  <p className="text-sm font-medium">No products found</p>
                  <button
                    onClick={() => { resetProductForm(); setIsAddProductOpen(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 text-violet-600 font-bold text-xs rounded-xl transition-colors border border-violet-200 dark:border-violet-700"
                  >
                    <FiPlus /> Add New Product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4 max-h-[420px] overflow-y-auto">
                  {filteredProducts.map(product => {
                    const inCart = cart.find(i => i.productId === product.id);
                    return (
                      <motion.button
                        key={product.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => addToCart(product)}
                        className={`relative text-left p-3 rounded-xl border-2 transition-all ${
                          inCart
                            ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-600'
                            : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:border-violet-300 dark:hover:border-violet-600'
                        }`}
                      >
                        {inCart && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-violet-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                            {inCart.qty}
                          </span>
                        )}
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-lg flex items-center justify-center mb-2">
                          <FiPackage className="text-white text-xs" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight line-clamp-2">{product.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{product.sku}</p>
                        <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mt-1">{formatCurrency(product.cost)}</p>
                        {product.stock <= product.minStock && (
                          <span className="text-[9px] text-amber-600 font-bold">Low Stock</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Supplier + Cart + Summary */}
          <div className="space-y-4">
            {/* Supplier Select */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Supplier *</h3>
                <button
                  onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '' }); setIsAddSupplierOpen(true); }}
                  className="text-[10px] text-violet-600 font-bold hover:underline flex items-center gap-1"
                >
                  <FiPlus className="text-xs" /> New
                </button>
              </div>
              {selectedSupplier ? (
                <div className="flex items-center gap-2 p-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-xl">
                  <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center text-white font-black text-sm">
                    {selectedSupplier.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{selectedSupplier.name}</p>
                    {selectedSupplier.phone && <p className="text-[10px] text-slate-500">{selectedSupplier.phone}</p>}
                  </div>
                  <button onClick={() => setSelectedSupplier(null)} className="text-slate-400 hover:text-red-500 p-1">
                    <FiX className="text-xs" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-2">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="text"
                      value={supplierSearch}
                      onChange={e => setSupplierSearch(e.target.value)}
                      placeholder="Search suppliers…"
                      className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {loadingSuppliers ? (
                      <div className="text-xs text-slate-400 py-2 text-center">Loading…</div>
                    ) : filteredSuppliers.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2 text-center">No suppliers found</div>
                    ) : filteredSuppliers.map(sup => (
                      <button
                        key={sup.id}
                        onClick={() => { setSelectedSupplier(sup); setSupplierSearch(''); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                      >
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{sup.name}</p>
                        {sup.phone && <p className="text-[10px] text-slate-400">{sup.phone}</p>}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-3 space-y-2">
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                >
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"
                />
              </div>
            </div>

            {/* Cart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FiShoppingBag /> Cart ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1">
                    <FiX /> Clear
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-10 flex flex-col items-center text-slate-300 dark:text-slate-600">
                  <FiShoppingBag className="text-4xl mb-2" />
                  <p className="text-xs font-medium">Scan or click products to add</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-64 overflow-y-auto">
                  <AnimatePresence>
                    {cart.map(item => (
                      <motion.div
                        key={item.productId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="px-4 py-3"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                            {item.sku && <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>}
                          </div>
                          <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 p-1 shrink-0">
                            <FiTrash2 className="text-xs" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateCartQty(item.productId, -1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-800/40 transition-colors shrink-0"
                            >
                              <FiMinus className="text-xs" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val >= 1) {
                                  setCart(prev => prev.map(i => i.productId === item.productId ? { ...i, qty: val } : i));
                                }
                              }}
                              onBlur={e => {
                                const val = parseInt(e.target.value, 10);
                                if (isNaN(val) || val < 1) {
                                  setCart(prev => prev.map(i => i.productId === item.productId ? { ...i, qty: 1 } : i));
                                }
                              }}
                              className="w-12 text-center text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent border-none outline-none focus:bg-violet-50 dark:focus:bg-violet-900/30 transition-colors py-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => updateCartQty(item.productId, 1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-800/40 transition-colors shrink-0"
                            >
                              <FiPlus className="text-xs" />
                            </button>
                          </div>
                          <div className="flex-1 relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                            <input
                              type="number"
                              value={item.unitCost}
                              onChange={e => updateCartCost(item.productId, e.target.value)}
                              className="w-full pl-5 pr-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                              min={0}
                              step="0.01"
                            />
                          </div>
                          <span className="text-xs font-bold text-violet-700 dark:text-violet-300 min-w-[60px] text-right">
                            {formatCurrency(item.qty * item.unitCost)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Summary & Submit */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex justify-between font-black text-slate-900 dark:text-white text-base">
                <span>GRAND TOTAL</span>
                <span className="text-violet-700 dark:text-violet-300">{formatCurrency(grandTotal)}</span>
              </div>

              {!selectedSupplier && cart.length > 0 && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl px-3 py-2 text-xs font-bold">
                  <FiAlertCircle className="shrink-0" /> Please select a supplier above
                </div>
              )}

              <button
                onClick={handleSubmitPO}
                disabled={cart.length === 0 || !selectedSupplier || createPOMutation.isPending}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {createPOMutation.isPending ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                ) : (
                  <><FiCheck /> Submit Purchase Order</>
                )}
              </button>

              {cart.length > 0 && selectedSupplier && (
                <p className="text-[10px] text-slate-400 text-center">
                  ✅ Inventory will be auto-updated on submission
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Purchase History                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1 relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Search PO# or supplier…"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                />
              </div>
              <input
                type="date"
                value={historyDateFrom}
                onChange={e => setHistoryDateFrom(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              />
              <input
                type="date"
                value={historyDateTo}
                onChange={e => setHistoryDateTo(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              />
            </div>
          </div>

          {loadingPOs ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-16 flex flex-col items-center text-slate-400">
              <FiTruck className="text-5xl mb-3 opacity-40" />
              <p className="font-bold text-sm">No purchase orders found</p>
              <p className="text-xs mt-1">Create your first PO from the New Purchase tab</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/60">
                    <tr>
                      {['PO Number', 'Date', 'Supplier', 'Items', 'Total', 'Status', 'Created By', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {filteredHistory.map(po => (
                      <tr key={po.id} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer" onClick={() => setViewPO(po)}>
                        <td className="px-4 py-3 font-bold text-violet-700 dark:text-violet-300 font-mono text-xs">{po.poNumber}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">{formatDateTime(po.date)}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs">{po.supplierName || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold rounded-full">{po.items?.length ?? 0}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-xs">{formatCurrency(po.total)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColor(po.status)}`}>{po.status?.replace('_', ' ')}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{po.createdBy || '—'}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setActivePrintPO(po)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors" title="Print">
                            <FiPrinter className="text-sm" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Showing {filteredHistory.length} of {purchaseOrders.length} orders</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Total: {formatCurrency(filteredHistory.reduce((s, po) => s + po.total, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Suppliers                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '' }); setIsAddSupplierOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl shadow-sm transition-colors"
            >
              <FiPlus /> Add Supplier
            </button>
          </div>

          {loadingSuppliers ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : suppliers.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-16 flex flex-col items-center text-slate-400">
              <FiUsers className="text-5xl mb-3 opacity-40" />
              <p className="font-bold text-sm">No suppliers yet</p>
              <p className="text-xs mt-1">Add your first supplier to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map(sup => {
                const supPOs = purchaseOrders.filter(po => po.supplierId === sup.id);
                const supTotal = supPOs.reduce((s, po) => s + po.total, 0);
                return (
                  <motion.div
                    key={sup.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-sm">
                        {sup.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditSupplier(sup)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button onClick={() => setDeleteSupplierTarget(sup)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{sup.name}</h3>
                    {sup.contactPerson && <p className="text-xs text-slate-500 mt-0.5">👤 {sup.contactPerson}</p>}
                    {sup.phone && <p className="text-xs text-slate-500">📞 {sup.phone}</p>}
                    {sup.email && <p className="text-xs text-slate-500">✉️ {sup.email}</p>}
                    {sup.gstin && <p className="text-xs text-slate-400">GSTIN: {sup.gstin}</p>}
                    {sup.address && <p className="text-xs text-slate-400 mt-1 line-clamp-1">📍 {sup.address}</p>}
                    <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">PO Count</p>
                        <p className="text-sm font-black text-violet-700 dark:text-violet-300">{supPOs.length}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Total Value</p>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">{formatCurrency(supTotal)}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: PO Detail                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal isOpen={!!viewPO} onClose={() => setViewPO(null)} title={`Purchase Order — ${viewPO?.poNumber}`} size="lg">
        {viewPO && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Date', value: formatDateTime(viewPO.date) },
                { label: 'Supplier', value: viewPO.supplierName || '—' },
                { label: 'Status', value: viewPO.status?.replace('_', ' ').toUpperCase() },
                { label: 'Created By', value: viewPO.createdBy || '—' },
              ].map(d => (
                <div key={d.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{d.label}</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{d.value}</p>
                </div>
              ))}
            </div>

            {viewPO.notes && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                📝 {viewPO.notes}
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/60">
                  <tr>
                    {['#', 'Product', 'SKU', 'Ordered', 'Received', 'Unit Cost', 'Total'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {(viewPO.items || []).map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-200 text-xs">{item.name || item.productName}</td>
                      <td className="px-3 py-2.5 text-slate-400 text-xs font-mono">{item.sku || '—'}</td>
                      <td className="px-3 py-2.5 font-bold text-center text-xs">{item.qty}</td>
                      <td className="px-3 py-2.5 text-center text-xs">
                        <span className={`font-bold ${item.receivedQuantity >= item.qty ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {item.receivedQuantity ?? item.qty}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 text-xs">{formatCurrency(item.unitCost)}</td>
                      <td className="px-3 py-2.5 font-bold text-violet-700 dark:text-violet-300 text-xs">{formatCurrency(item.qty * item.unitCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 min-w-[200px]">
                <div className="flex justify-between font-black text-slate-900 dark:text-white text-sm">
                  <span>TOTAL</span><span className="text-violet-600">{formatCurrency(viewPO.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => { setActivePrintPO(viewPO); setViewPO(null); }}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors"
              >
                <FiPrinter /> Print
              </button>
              <button onClick={() => setViewPO(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Add New Product (same as Products page)                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isAddProductOpen}
        onClose={() => { setIsAddProductOpen(false); resetProductForm(); }}
        title="Add New Product"
        size="lg"
      >
        <form onSubmit={handleProductSubmit(handleCreateProduct)} className="p-6 space-y-4">
          {/* Row 1: Name, SKU, Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Product Name"
              placeholder="e.g. Apple iPhone 15 Pro"
              error={productErrors.name?.message}
              required
              {...registerProduct('name', { required: 'Name is required' })}
            />
            <Input
              label="SKU / Model ID"
              placeholder="e.g. IPH15-128-BLK"
              error={productErrors.sku?.message}
              required
              {...registerProduct('sku', { required: 'SKU is required' })}
            />
            <Input
              label="Barcode (optional)"
              placeholder="e.g. 190199000142"
              {...registerProduct('barcode')}
            />
          </div>

          {/* Row 2: Category, Cost, GST */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Select
                label="Category"
                options={categories}
                error={productErrors.category?.message}
                required
                {...registerProduct('category', { required: 'Category is required' })}
              />
              <button
                type="button"
                onClick={() => { setNewCategoryName(''); setIsAddCategoryOpen(true); }}
                className="mt-1 text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-1"
              >
                <FiPlus className="text-[10px]" /> Add new category
              </button>
            </div>
            <Input
              label="Cost Price (Wholesale)"
              type="number"
              placeholder="0.00"
              error={productErrors.cost?.message}
              required
              {...registerProduct('cost', { required: 'Cost is required' })}
            />
            <Select
              label="GST Rate (%)"
              options={[
                { value: 0, label: '0%' },
                { value: 5, label: '5%' },
                { value: 12, label: '12%' },
                { value: 18, label: '18% (Default)' },
                { value: 28, label: '28%' },
              ]}
              defaultValue={18}
              {...registerProduct('taxRate')}
            />
          </div>

          {/* Row 3: Price, Stock, Min Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Retail Selling Price"
              type="number"
              placeholder="0.00"
              error={productErrors.price?.message}
              required
              {...registerProduct('price', { required: 'Price is required' })}
            />
            <Input
              label="Initial Stock Qty"
              type="number"
              placeholder="0"
              {...registerProduct('stock')}
            />
            <Input
              label="Low Stock Alert Qty"
              type="number"
              placeholder="2"
              {...registerProduct('minStock')}
            />
          </div>

          {/* IMEI */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
            <Checkbox
              label="Require IMEI / Serial tracking for sales"
              {...registerProduct('imeiRequired')}
            />
            <Input
              label="IMEI Numbers (Comma Separated)"
              placeholder="358762109876541, 358762109876542..."
              hint="Only for mobile phones/laptops with IMEI tracking"
              {...registerProduct('imeis')}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              className="rounded-xl px-5"
              type="button"
              onClick={() => { setIsAddProductOpen(false); resetProductForm(); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="rounded-xl px-5"
              loading={createProductMutation.isPending}
            >
              Add Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Add New Category                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isAddCategoryOpen}
        onClose={() => { setIsAddCategoryOpen(false); setNewCategoryName(''); }}
        title="Add New Category"
        size="sm"
      >
        <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create a new product category. It will be available immediately in the product form above.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category Name *</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="e.g. Smartphones, Earphones, Accessories…"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              autoFocus
              required
            />
          </div>

          {/* Existing categories preview */}
          {categories.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Existing Categories</p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {categories.map((cat, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-lg border border-indigo-100 dark:border-indigo-800/40">
                    <FiFolder className="text-[10px]" /> {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setIsAddCategoryOpen(false); setNewCategoryName(''); }}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              disabled={createCategoryMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {createCategoryMutation.isPending && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Create Category
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Add / Edit Supplier                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isAddSupplierOpen}
        onClose={() => { setIsAddSupplierOpen(false); setEditingSupplier(null); }}
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        size="sm"
      >
        <div className="p-6 space-y-3">
          {[
            { field: 'name', placeholder: 'Supplier name *', type: 'text' },
            { field: 'contactPerson', placeholder: 'Contact person', type: 'text' },
            { field: 'phone', placeholder: 'Phone number', type: 'text' },
            { field: 'email', placeholder: 'Email address', type: 'email' },
            { field: 'gstin', placeholder: 'GSTIN (optional)', type: 'text' },
          ].map(({ field, placeholder, type }) => (
            <input
              key={field}
              type={type}
              value={supplierForm[field]}
              onChange={e => setSupplierForm(f => ({ ...f, [field]: e.target.value }))}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
            />
          ))}
          <textarea
            value={supplierForm.address}
            onChange={e => setSupplierForm(f => ({ ...f, address: e.target.value }))}
            placeholder="Address"
            rows={2}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"
          />
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setIsAddSupplierOpen(false); setEditingSupplier(null); }}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSupplier}
              disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {(createSupplierMutation.isPending || updateSupplierMutation.isPending) && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {editingSupplier ? 'Update' : 'Add Supplier'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm Delete Supplier ──────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteSupplierTarget}
        onClose={() => setDeleteSupplierTarget(null)}
        onConfirm={() => deleteSupplierMutation.mutate(deleteSupplierTarget.id)}
        title="Delete Supplier"
        message={`Remove "${deleteSupplierTarget?.name}" from your supplier list? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteSupplierMutation.isPending}
      />
    </div>
  );
};

export default Purchases;
