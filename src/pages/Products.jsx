import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiBox, FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiAlertTriangle, FiCheckCircle, FiShare2, FiFolder, FiTag, FiPrinter, FiDownload
} from 'react-icons/fi';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { productApi, settingsApi } from '../api/services';
import { TableCard } from '../components/ui/DataTable';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Input, Select, Checkbox, SearchInput } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/helpers';
import { PRODUCT_CATEGORIES } from '../utils/constants';

const DEFAULT_LAYOUT = {
  shopName:    { x: 3,  y: 2,  w: 50, h: 13, fontSize: 7,  fontWeight: 700, align: 'left',   visible: true },
  price:       { x: 55, y: 2,  w: 42, h: 14, fontSize: 12, fontWeight: 900, align: 'right',  visible: true },
  productName: { x: 3,  y: 16, w: 94, h: 16, fontSize: 9,  fontWeight: 800, align: 'center', visible: true },
  barcode:     { x: 3,  y: 33, w: 94, h: 44, visible: true },
  sku:         { x: 3,  y: 79, w: 30, h: 13, fontSize: 5,  fontWeight: 600, align: 'left',   visible: true },
  color:       { x: 35, y: 79, w: 28, h: 13, fontSize: 5,  fontWeight: 600, align: 'center', visible: true },
  size:        { x: 65, y: 79, w: 32, h: 13, fontSize: 5,  fontWeight: 600, align: 'right',  visible: true },
};

// Element display labels for the canvas UI
const ELEMENT_LABELS = {
  shopName: 'Shop',
  price: 'Price',
  productName: 'Product',
  barcode: 'Barcode',
  sku: 'SKU',
  color: 'Color',
  size: 'Size',
};

export const Products = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories'
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);

  React.useEffect(() => {
    if (location.pathname.endsWith('/categories')) {
      setActiveTab('categories');
      setIsAddOpen(false);
    } else if (location.pathname.endsWith('/add')) {
      setActiveTab('products');
      setIsAddOpen(true);
    } else {
      setActiveTab('products');
      setIsAddOpen(false);
    }
  }, [location.pathname]);

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    if (location.pathname.endsWith('/add')) {
      navigate('/products');
    }
  };
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);

  // Fetch shop settings for sticker header
  const { data: shopSettings } = useQuery({
    queryKey: ['shopSettings'],
    queryFn: () => settingsApi.getShop().then(res => res.data),
  });

  // Barcode Sticker State
  const [selectedStickerProduct, setSelectedStickerProduct] = useState(null);
  const [activePrintSticker, setActivePrintSticker] = useState(null);

  // Sticker customize form states
  const [stickerName, setStickerName] = useState('');
  const [stickerBarcode, setStickerBarcode] = useState('');
  const [stickerPrice, setStickerPrice] = useState('');
  const [stickerSku, setStickerSku] = useState('');
  const [stickerColor, setStickerColor] = useState('');
  const [stickerSize, setStickerSize] = useState('');
  const [stickerWidth, setStickerWidth] = useState(() => {
    const saved = localStorage.getItem('pos_sticker_width');
    return saved ? Number(saved) : 50;
  });
  const [stickerHeight, setStickerHeight] = useState(() => {
    const saved = localStorage.getItem('pos_sticker_height');
    return saved ? Number(saved) : 25;
  });
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('pos_sticker_layout');
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [dragState, setDragState] = useState(null);

  const barcodeSvgRef = useRef(null);
  const canvasRef = useRef(null);

  // Prepopulate sticker editor form when a product is clicked
  useEffect(() => {
    if (selectedStickerProduct) {
      setStickerName(selectedStickerProduct.name || '');
      setStickerBarcode(selectedStickerProduct.barcode || selectedStickerProduct.sku || '');
      setStickerPrice(selectedStickerProduct.price !== undefined ? selectedStickerProduct.price : 0);
      setStickerSku(selectedStickerProduct.sku || '');
      setStickerColor('');
      setStickerSize('');
      
      const savedWidth = localStorage.getItem('pos_sticker_width');
      const savedHeight = localStorage.getItem('pos_sticker_height');
      const savedLayout = localStorage.getItem('pos_sticker_layout');
      
      setStickerWidth(savedWidth ? Number(savedWidth) : 50);
      setStickerHeight(savedHeight ? Number(savedHeight) : 25);
      setLayout(savedLayout ? JSON.parse(savedLayout) : JSON.parse(JSON.stringify(DEFAULT_LAYOUT)));
      
      setSelectedElementId(null);
      setDragState(null);
    }
  }, [selectedStickerProduct]);

  // Live render the barcode inside the modal preview canvas
  useEffect(() => {
    if (selectedStickerProduct && barcodeSvgRef.current && stickerBarcode && layout.barcode) {
      try {
        // Canvas pixel dimensions (1mm = 3.6px at our preview scale)
        const canvasW = Number(stickerWidth) * 3.6;
        const canvasH = Number(stickerHeight) * 3.6;
        const barcodeH = layout.barcode.h;
        const barcodeW = layout.barcode.w;
        const pixelHeight = Math.max(12, (barcodeH / 100) * canvasH - 14);
        const pixelWidth  = (barcodeW / 100) * canvasW;
        const barWidth    = Math.max(0.8, Math.min(2.5, pixelWidth / 110));

        JsBarcode(barcodeSvgRef.current, stickerBarcode, {
          format:       'CODE128',
          width:        barWidth,
          height:       pixelHeight,
          displayValue: false,
          margin:       0,
          background:   'transparent',
          lineColor:    '#000000',
        });
      } catch (err) {
        console.warn('JsBarcode SVG live render failed:', err);
      }
    }
  }, [selectedStickerProduct, stickerBarcode, stickerHeight, stickerWidth, layout.barcode?.w, layout.barcode?.h]);

  // Global mouse-tracking useEffect for absolute coordinate drag & resize operations
  useEffect(() => {
    if (!dragState) return;

    const handleGlobalMouseMove = (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - dragState.startX;
      const deltaY = currentY - dragState.startY;

      // Convert pixel delta to percentage
      const deltaPercentX = (deltaX / rect.width) * 100;
      const deltaPercentY = (deltaY / rect.height) * 100;

      setLayout((prev) => {
        const el = prev[selectedElementId];
        if (!el) return prev;
        if (dragState.mode === 'drag') {
          // Absolute dragging within [0, 100 - w] and [0, 100 - h] bounds
          const newX = Math.max(0, Math.min(100 - el.w, dragState.startLeft + deltaPercentX));
          const newY = Math.max(0, Math.min(100 - el.h, dragState.startTop + deltaPercentY));
          return {
            ...prev,
            [selectedElementId]: { ...el, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 }
          };
        } else if (dragState.mode === 'resize') {
          // Absolute resizing with minimum dimensions
          const newW = Math.max(5, Math.min(100 - el.x, dragState.startWidth + deltaPercentX));
          const newH = Math.max(3, Math.min(100 - el.y, dragState.startHeight + deltaPercentY));
          
          // Proportional font size scaling based on height change
          let newFontSize = el.fontSize;
          if (selectedElementId !== 'barcode' && dragState.startHeight > 0) {
            const scale = newH / dragState.startHeight;
            newFontSize = Math.max(3, Math.min(40, Math.round(dragState.startFontSize * scale * 10) / 10));
          }

          return {
            ...prev,
            [selectedElementId]: { 
              ...el, 
              w: Math.round(newW * 10) / 10, 
              h: Math.round(newH * 10) / 10,
              fontSize: newFontSize
            }
          };
        }
        return prev;
      });
    };

    const handleGlobalMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragState, selectedElementId]);

  // Helpers for text layout contents
  const getElementText = (id) => {
    switch (id) {
      case 'shopName': return shopSettings?.name || 'Galaxy POS Shop';
      case 'price': return formatCurrency(Number(stickerPrice) || 0);
      case 'productName': return stickerName;
      case 'sku': return stickerSku ? `SKU: ${stickerSku}` : '';
      case 'color': return stickerColor ? `COL: ${stickerColor}` : '';
      case 'size': return stickerSize ? `SZ: ${stickerSize}` : '';
      default: return '';
    }
  };

  const isElementVisible = (id) => {
    const el = layout[id];
    if (!el || !el.visible) return false;
    if (id === 'barcode') return true;
    return !!getElementText(id);
  };

  const handleElementMouseDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedElementId(id);
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const el = layout[id];
    setDragState({
      mode: 'drag',
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startLeft: el.x,
      startTop: el.y
    });
  };

  const handleResizeMouseDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedElementId(id);
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const el = layout[id];
    setDragState({
      mode: 'resize',
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startWidth: el.w,
      startHeight: el.h,
      startFontSize: el.fontSize || 6
    });
  };

  const handleCanvasMouseDown = (e) => {
    // Deselect active layer if user clicks directly on the canvas background
    if (e.target === canvasRef.current || e.target.id === 'barcode-sticker-preview') {
      setSelectedElementId(null);
    }
  };

  const handleSaveLayout = () => {
    try {
      localStorage.setItem('pos_sticker_layout', JSON.stringify(layout));
      localStorage.setItem('pos_sticker_width', String(stickerWidth));
      localStorage.setItem('pos_sticker_height', String(stickerHeight));
      addToast('Sticker design template saved as system default!', 'success');
    } catch (err) {
      console.error('Failed to save layout:', err);
      addToast('Failed to save design template', 'error');
    }
  };

  // Print sticker trigger
  useEffect(() => {
    if (activePrintSticker) {
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error('Sticker print failed:', err);
        } finally {
          setActivePrintSticker(null);
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activePrintSticker]);

  // Forms
  const { register: registerAdd, handleSubmit: handleAddSubmit, reset: resetAdd, formState: { errors: errorsAdd } } = useForm();
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setEditValue, formState: { errors: errorsEdit } } = useForm();

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll().then(res => res.data),
  });

  // Fetch categories (mock handles this)
  const { data: categories = PRODUCT_CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories().then(res => res.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast('Product added successfully', 'success');
      setIsAddOpen(false);
      resetAdd();
    },
    onError: () => addToast('Failed to add product', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast('Product updated successfully', 'success');
      setIsEditOpen(false);
      setEditingProduct(null);
    },
    onError: () => addToast('Failed to update product', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast('Product deleted successfully', 'success');
      setDeleteProduct(null);
    },
    onError: () => addToast('Failed to delete product', 'error'),
  });

  const handleCreate = (data) => {
    createMutation.mutate({
      ...data,
      price: Number(data.price),
      cost: Number(data.cost),
      stock: Number(data.stock),
      minStock: Number(data.minStock),
      taxRate: Number(data.taxRate !== undefined ? data.taxRate : 18),
      imeiList: data.imeiRequired ? data.imeis?.split(',').map(i => i.trim()).filter(Boolean) : [],
    });
  };

  const handleUpdate = (data) => {
    updateMutation.mutate({
      id: editingProduct.id,
      data: {
        ...data,
        price: Number(data.price),
        cost: Number(data.cost),
        stock: Number(data.stock),
        minStock: Number(data.minStock),
        taxRate: Number(data.taxRate !== undefined ? data.taxRate : 18),
        imeiList: data.imeiRequired ? data.imeis?.split(',').map(i => i.trim()).filter(Boolean) : [],
      }
    });
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setEditValue('name', product.name);
    setEditValue('sku', product.sku);
    setEditValue('barcode', product.barcode || '');
    setEditValue('category', product.category);
    setEditValue('cost', product.cost);
    setEditValue('price', product.price);
    setEditValue('stock', product.stock);
    setEditValue('minStock', product.minStock);
    setEditValue('taxRate', product.taxRate !== undefined ? product.taxRate : 18);
    setEditValue('imeiRequired', product.imeiRequired);
    setEditValue('imeis', product.imeiList?.join(', ') || '');
    setIsEditOpen(true);
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      label: 'SKU / Barcode',
      key: 'sku',
      className: 'font-semibold font-mono text-xs text-slate-500',
      render: (val, row) => (
        <div className="space-y-0.5">
          <p className="font-semibold font-mono text-xs text-slate-500">{val}</p>
          {row.barcode && <p className="text-[10px] text-slate-400 font-mono">BC: {row.barcode}</p>}
        </div>
      )
    },
    { label: 'Product Name', key: 'name', className: 'font-bold text-slate-800 dark:text-slate-200' },
    { label: 'Category', key: 'category' },
    { label: 'Cost Price', key: 'cost', render: (val) => formatCurrency(val) },
    {
      label: 'Retail Price',
      key: 'price',
      render: (val, row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(val)}</p>
          <p className="text-[10px] text-slate-400">GST: {row.taxRate !== undefined ? row.taxRate : 18}%</p>
        </div>
      )
    },
    {
      label: 'Stock Status',
      key: 'stock',
      render: (val, row) => {
        if (val <= 0) return <Badge variant="danger">Out of Stock</Badge>;
        if (val <= row.minStock) return <Badge variant="warning">{val} (Low Stock)</Badge>;
        return <Badge variant="success">{val} Available</Badge>;
      }
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedStickerProduct(row)}
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 transition-colors"
            title="Print Barcode Sticker"
          >
            <FiTag className="text-sm" />
          </button>
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
            title="Edit"
          >
            <FiEdit2 className="text-sm" />
          </button>
          <button
            onClick={() => setDeleteProduct(row)}
            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 transition-colors"
            title="Delete"
          >
            <FiTrash2 className="text-sm" />
          </button>
        </div>
      )
    }
  ];

  // Download single sticker PDF
  const downloadStickerPdf = async () => {
    const element = document.getElementById('barcode-sticker-preview');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        background: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [Number(stickerWidth), Number(stickerHeight)]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, Number(stickerWidth), Number(stickerHeight));
      pdf.save(`Sticker_${stickerBarcode || 'barcode'}.pdf`);
      addToast('Barcode sticker PDF downloaded!', 'success');
    } catch (err) {
      console.error('PDF generation failed:', err);
      addToast('Failed to download PDF sticker', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Products Catalog</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">View and update inventory models, prices, and stock indicators.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" className="rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm" onClick={() => navigate('/products/add')}>
            <FiPlus /> Add Product
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => navigate('/products')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-1 flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FiBox /> Products List
        </button>
        <button
          onClick={() => navigate('/products/categories')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-1 flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FiFolder /> Product Categories
        </button>
      </div>

      {activeTab === 'products' ? (
        <div className="space-y-4">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder="Search products by name, SKU..."
              className="sm:col-span-2"
            />
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={categories}
              placeholder="All Categories"
            />
          </div>

          {/* DataTable Card */}
          <TableCard
            columns={columns}
            data={filteredProducts}
            loading={isLoading}
            emptyTitle="No products found"
            emptyDescription="Try modifying your search filter or click Add Product to insert one."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">Existing Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-2 border border-slate-100 dark:border-slate-800">
                  <FiFolder className="text-blue-500 text-sm" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{cat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">Create New Category</h2>
            <p className="text-[11px] text-slate-400 mb-4">Add a new retail department or replacement parts classification category.</p>
            <form onSubmit={(e) => { e.preventDefault(); addToast('Category added successfully (demonstration mode)', 'success'); }} className="space-y-4">
              <Input label="Category Name" placeholder="e.g. Earphones" required />
              <Button type="submit" variant="primary" fullWidth className="rounded-xl">Create Category</Button>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal isOpen={isAddOpen} onClose={handleCloseAdd} title="Add New Product Intake" size="lg">
        <form onSubmit={handleAddSubmit(handleCreate)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Product Name"
              placeholder="e.g. Apple iPhone 15 Pro"
              error={errorsAdd.name?.message}
              required
              {...registerAdd('name', { required: 'Name is required' })}
            />
            <Input
              label="SKU / Unique Model Identifier"
              placeholder="e.g. IPH15-128-BLK"
              error={errorsAdd.sku?.message}
              required
              {...registerAdd('sku', { required: 'SKU is required' })}
            />
            <Input
              label="Barcode (optional)"
              placeholder="e.g. 190199000142"
              error={errorsAdd.barcode?.message}
              {...registerAdd('barcode')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Department Category"
              options={categories}
              error={errorsAdd.category?.message}
              required
              {...registerAdd('category', { required: 'Category is required' })}
            />
            <Input
              label="Cost Price (Wholesale)"
              type="number"
              placeholder="Wholesale price"
              error={errorsAdd.cost?.message}
              required
              {...registerAdd('cost', { required: 'Cost price is required' })}
            />
            <Select
              label="GST Rate (%)"
              options={[
                { value: 0, label: '0%' },
                { value: 5, label: '5%' },
                { value: 12, label: '12%' },
                { value: 18, label: '18% (Default)' },
                { value: 28, label: '28%' }
              ]}
              defaultValue={18}
              error={errorsAdd.taxRate?.message}
              {...registerAdd('taxRate')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Retail Selling Price"
              type="number"
              placeholder="Retail price"
              error={errorsAdd.price?.message}
              required
              {...registerAdd('price', { required: 'Retail price is required' })}
            />
            <Input
              label="Initial Stock Quantity"
              type="number"
              placeholder="0"
              error={errorsAdd.stock?.message}
              required
              {...registerAdd('stock', { required: 'Stock is required' })}
            />
            <Input
              label="Alert Threshold Quantity"
              type="number"
              placeholder="2"
              error={errorsAdd.minStock?.message}
              required
              {...registerAdd('minStock', { required: 'Alert threshold is required' })}
            />
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
            <Checkbox
              label="Require IMEI / Unique Serial tracking for sales"
              {...registerAdd('imeiRequired')}
            />
            <Input
              label="IMEI Numbers (Comma Separated)"
              placeholder="358762109876541, 358762109876542..."
              hint="Required only for trackable mobile phones/laptops"
              {...registerAdd('imeis')}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" className="rounded-xl px-5" onClick={handleCloseAdd} type="button">Cancel</Button>
            <Button type="submit" variant="primary" className="rounded-xl px-5" loading={createMutation.isPending}>Add Product</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Catalog Product Details" size="lg">
        <form onSubmit={handleEditSubmit(handleUpdate)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Product Name"
              error={errorsEdit.name?.message}
              required
              {...registerEdit('name', { required: 'Name is required' })}
            />
            <Input
              label="SKU / Unique Model Identifier"
              error={errorsEdit.sku?.message}
              required
              {...registerEdit('sku', { required: 'SKU is required' })}
            />
            <Input
              label="Barcode (optional)"
              placeholder="e.g. 190199000142"
              error={errorsEdit.barcode?.message}
              {...registerEdit('barcode')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Department Category"
              options={categories}
              error={errorsEdit.category?.message}
              required
              {...registerEdit('category', { required: 'Category is required' })}
            />
            <Input
              label="Cost Price (Wholesale)"
              type="number"
              error={errorsEdit.cost?.message}
              required
              {...registerEdit('cost', { required: 'Cost price is required' })}
            />
            <Select
              label="GST Rate (%)"
              options={[
                { value: 0, label: '0%' },
                { value: 5, label: '5%' },
                { value: 12, label: '12%' },
                { value: 18, label: '18% (Default)' },
                { value: 28, label: '28%' }
              ]}
              error={errorsEdit.taxRate?.message}
              {...registerEdit('taxRate')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Retail Selling Price"
              type="number"
              error={errorsEdit.price?.message}
              required
              {...registerEdit('price', { required: 'Retail price is required' })}
            />
            <Input
              label="Initial Stock Quantity"
              type="number"
              error={errorsEdit.stock?.message}
              required
              {...registerEdit('stock', { required: 'Stock is required' })}
            />
            <Input
              label="Alert Threshold Quantity"
              type="number"
              error={errorsEdit.minStock?.message}
              required
              {...registerEdit('minStock', { required: 'Alert threshold is required' })}
            />
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
            <Checkbox
              label="Require IMEI / Unique Serial tracking for sales"
              {...registerEdit('imeiRequired')}
            />
            <Input
              label="IMEI Numbers (Comma Separated)"
              placeholder="358762109876541, 358762109876542..."
              hint="Required only for trackable mobile phones/laptops"
              {...registerEdit('imeis')}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" className="rounded-xl px-5" onClick={() => setIsEditOpen(false)} type="button">Cancel</Button>
            <Button type="submit" variant="primary" className="rounded-xl px-5" loading={updateMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={() => deleteMutation.mutate(deleteProduct.id)}
        title="Delete Product"
        message={`Are you sure you want to delete ${deleteProduct?.name}? This action cannot be undone.`}
        loading={deleteMutation.isPending}
      />

      {/* Barcode Sticker Preview & Customize Modal */}
      <Modal isOpen={!!selectedStickerProduct} onClose={() => setSelectedStickerProduct(null)} title="Print Barcode Label Sticker" size="lg">
        {selectedStickerProduct && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Form controls & Editor properties */}
              <div className="space-y-6 max-h-[550px] overflow-y-auto pr-2">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider border-b pb-2">Sticker Text Content</h3>
                  <Input
                    label="Product Name"
                    value={stickerName}
                    onChange={(e) => setStickerName(e.target.value)}
                    maxLength={30}
                  />
                  <Input
                    label="Barcode Number"
                    value={stickerBarcode}
                    onChange={(e) => setStickerBarcode(e.target.value)}
                    maxLength={20}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="MRP Price"
                      type="number"
                      value={stickerPrice}
                      onChange={(e) => setStickerPrice(e.target.value)}
                    />
                    <Input
                      label="SKU"
                      value={stickerSku}
                      onChange={(e) => setStickerSku(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Color"
                      placeholder="e.g. Black"
                      value={stickerColor}
                      onChange={(e) => setStickerColor(e.target.value)}
                    />
                    <Input
                      label="Size"
                      placeholder="e.g. M"
                      value={stickerSize}
                      onChange={(e) => setStickerSize(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-150 pt-4">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider border-b pb-2">Sticker Size</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Width (mm)"
                      type="number"
                      value={stickerWidth}
                      onChange={(e) => setStickerWidth(Number(e.target.value) || 0)}
                      min={20}
                      max={150}
                    />
                    <Input
                      label="Height (mm)"
                      type="number"
                      value={stickerHeight}
                      onChange={(e) => setStickerHeight(Number(e.target.value) || 0)}
                      min={15}
                      max={100}
                    />
                  </div>
                </div>

                {/* Selected Element Designer Properties */}
                <div className="space-y-4 border-t border-slate-150 pt-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Layout Controls
                    </h3>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleSaveLayout}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Save Layout
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLayout(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)));
                          addToast('Layout reset to default. Click Save Layout to persist.', 'success');
                        }}
                        className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                      >
                        Reset Layout
                      </button>
                    </div>
                  </div>

                  {selectedElementId ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 capitalize">
                          Selected: {selectedElementId.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!layout[selectedElementId]?.visible}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setLayout(prev => ({
                                ...prev,
                                [selectedElementId]: { ...prev[selectedElementId], visible: checked }
                              }));
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-[10px] font-bold text-slate-500">Visible</span>
                        </label>
                      </div>

                      {layout[selectedElementId]?.visible && (
                        <div className="space-y-2 text-[11px]">
                          {/* Coordinates grid */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400 font-medium block mb-1">X Position (%)</span>
                              <input
                                type="number"
                                value={layout[selectedElementId].x}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setLayout(prev => ({
                                    ...prev,
                                    [selectedElementId]: { ...prev[selectedElementId], x: Math.max(0, Math.min(100, val)) }
                                  }));
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium block mb-1">Y Position (%)</span>
                              <input
                                type="number"
                                value={layout[selectedElementId].y}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setLayout(prev => ({
                                    ...prev,
                                    [selectedElementId]: { ...prev[selectedElementId], y: Math.max(0, Math.min(100, val)) }
                                  }));
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400 font-medium block mb-1">Width (%)</span>
                              <input
                                type="number"
                                value={layout[selectedElementId].w}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setLayout(prev => ({
                                    ...prev,
                                    [selectedElementId]: { ...prev[selectedElementId], w: Math.max(5, Math.min(100, val)) }
                                  }));
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded"
                              />
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium block mb-1">Height (%)</span>
                              <input
                                type="number"
                                value={layout[selectedElementId].h}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setLayout(prev => ({
                                    ...prev,
                                    [selectedElementId]: { ...prev[selectedElementId], h: Math.max(3, Math.min(100, val)) }
                                  }));
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded"
                              />
                            </div>
                          </div>

                          {/* Font Size & Alignment & Weight (if text element) */}
                          {selectedElementId !== 'barcode' && (
                            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                              <div>
                                <span className="text-slate-400 font-medium block mb-1">Font Size (pt)</span>
                                <input
                                  type="number"
                                  value={layout[selectedElementId].fontSize || 6}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 6;
                                    setLayout(prev => ({
                                      ...prev,
                                      [selectedElementId]: { ...prev[selectedElementId], fontSize: Math.max(3, Math.min(30, val)) }
                                    }));
                                  }}
                                  className="w-full px-1.5 py-1 bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded text-[10px]"
                                />
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium block mb-1">Align</span>
                                <select
                                  value={layout[selectedElementId].align || 'center'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setLayout(prev => ({
                                      ...prev,
                                      [selectedElementId]: { ...prev[selectedElementId], align: val }
                                    }));
                                  }}
                                  className="w-full px-1.5 py-1 bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded text-[10px]"
                                >
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium block mb-1">Weight</span>
                                <select
                                  value={layout[selectedElementId].fontWeight || 600}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setLayout(prev => ({
                                      ...prev,
                                      [selectedElementId]: { ...prev[selectedElementId], fontWeight: val }
                                    }));
                                  }}
                                  className="w-full px-1.5 py-1 bg-white border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded text-[10px]"
                                >
                                  <option value={400}>Normal</option>
                                  <option value={600}>Medium</option>
                                  <option value={800}>Bold</option>
                                  <option value={950}>Black</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Layers Panel — shown when nothing is selected */
                    <div className="space-y-1.5">
                      <p className="text-[9px] text-slate-400 mb-2">
                        👇 Click a layer to select, or toggle visibility
                      </p>
                      {Object.keys(DEFAULT_LAYOUT).map((id) => {
                        const el = layout[id];
                        if (!el) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer group transition-colors"
                            onClick={() => setSelectedElementId(id)}
                          >
                            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 flex-1">
                              {ELEMENT_LABELS[id]}
                            </span>
                            <label
                              className="flex items-center cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={!!el.visible}
                                onChange={(ev) => {
                                  setLayout(prev => ({
                                    ...prev,
                                    [id]: { ...prev[id], visible: ev.target.checked }
                                  }));
                                }}
                                className="sr-only"
                              />
                              <div
                                className={`w-6 h-3.5 rounded-full transition-colors ${el.visible ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                              >
                                <div
                                  className={`w-2.5 h-2.5 bg-white rounded-full mt-0.5 transition-transform shadow ${el.visible ? 'translate-x-3' : 'translate-x-0.5'}`}
                                />
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live sticker preview canvas */}
              <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 gap-3">
                {/* Canvas header toolbar */}
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    🎨 Canvas — {stickerWidth}mm × {stickerHeight}mm
                  </h3>
                  <div className="flex gap-1">
                    {selectedElementId && (
                      <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                        ✏️ {ELEMENT_LABELS[selectedElementId] || selectedElementId} selected
                      </span>
                    )}
                    {!selectedElementId && (
                      <span className="text-[9px] text-slate-400 italic">Click element to select</span>
                    )}
                  </div>
                </div>

                {/* Sticker canvas wrapper with checkerboard background */}
                <div
                  className="flex items-center justify-center w-full"
                  style={{
                    background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #f8fafc 0% 50%) 0 0 / 12px 12px',
                    padding: '16px',
                    borderRadius: '12px',
                    minHeight: `${Math.max(160, Number(stickerHeight) * 3.6 + 32)}px`
                  }}
                >
                  {/* The actual sticker canvas */}
                  <div
                    id="barcode-sticker-preview"
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    className="relative bg-white text-black font-sans select-none overflow-hidden"
                    style={{
                      width:     `${Number(stickerWidth)  * 3.6}px`,
                      height:    `${Number(stickerHeight) * 3.6}px`,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)',
                      border:    '0.5px solid #cbd5e1',
                      cursor:    dragState ? (dragState.mode === 'resize' ? 'se-resize' : 'grabbing') : 'default',
                    }}
                  >
                    {Object.keys(layout).map((id) => {
                      if (!isElementVisible(id)) return null;
                      const el       = layout[id];
                      const isSelected = selectedElementId === id;
                      const text     = getElementText(id);

                      // Compute responsive font size: fontSize is in "pt at 50mm width";
                      // scale it proportionally to current sticker dimensions
                      const canvasPxH   = Number(stickerHeight) * 3.6;
                      const computedFontSize = el.fontSize
                        ? `${el.fontSize * (canvasPxH / 90)}px`
                        : `${(el.h / 100) * canvasPxH * 0.55}px`;

                      return (
                        <div
                          key={id}
                          onMouseDown={(e) => handleElementMouseDown(e, id)}
                          className={`absolute group cursor-move select-none box-border flex flex-col justify-center ${
                            isSelected
                              ? 'z-30'
                              : 'z-10'
                          }`}
                          style={{
                            left:            `${el.x}%`,
                            top:             `${el.y}%`,
                            width:           `${el.w}%`,
                            height:          `${el.h}%`,
                            textAlign:       el.align || 'center',
                            fontSize:        computedFontSize,
                            lineHeight:      '1.15',
                            overflow:        'hidden',
                            color:           '#000000',
                            backgroundColor: isSelected ? 'rgba(59,130,246,0.06)' : 'transparent',
                            outline:         isSelected
                              ? '1.5px solid #2563eb'
                              : '1px dashed transparent',
                            outlineOffset:   '0px',
                            borderBottom:    id === 'shopName' ? '0.5px solid #e2e8f0' : undefined,
                            borderTop:       (id === 'sku' || id === 'color' || id === 'size') ? '0.5px solid #e2e8f0' : undefined,
                            transition:      dragState ? 'none' : 'outline 0.1s',
                          }}
                        >
                          {/* Hover label tooltip */}
                          {!dragState && (
                            <span
                              className="absolute -top-3.5 left-0 text-[7px] bg-blue-600 text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap"
                            >
                              {ELEMENT_LABELS[id]}
                            </span>
                          )}

                          {id === 'barcode' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <svg
                                ref={barcodeSvgRef}
                                style={{ maxHeight: '80%', maxWidth: '98%', display: 'block' }}
                              />
                              <span
                                style={{
                                  fontFamily:    'monospace',
                                  fontSize:      `${Math.max(5, Number(stickerHeight) * 0.16)}px`,
                                  letterSpacing: '0.08em',
                                  marginTop:     '1px',
                                  color:         '#000',
                                }}
                              >
                                {stickerBarcode}
                              </span>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontWeight:    el.fontWeight || 600,
                                whiteSpace:    'nowrap',
                                display:       'block',
                                width:         '100%',
                                overflow:      'hidden',
                                textOverflow:  'ellipsis',
                                color:         '#000000',
                                paddingLeft:   '1px',
                                paddingRight:  '1px',
                              }}
                            >
                              {text}
                            </span>
                          )}

                          {/* Selection handles */}
                          {isSelected && (
                            <>
                              {/* Corner resize handle (bottom-right) */}
                              <div
                                onMouseDown={(e) => handleResizeMouseDown(e, id)}
                                style={{
                                  position:  'absolute',
                                  bottom:    '-4px',
                                  right:     '-4px',
                                  width:     '9px',
                                  height:    '9px',
                                  background: '#2563eb',
                                  border:    '1.5px solid #fff',
                                  borderRadius: '2px',
                                  cursor:    'se-resize',
                                  zIndex:    50,
                                  boxShadow: '0 1px 4px rgba(37,99,235,0.5)',
                                }}
                              />
                              {/* Corner resize handle (bottom-left) */}
                              <div
                                style={{
                                  position:  'absolute',
                                  bottom:    '-4px',
                                  left:      '-4px',
                                  width:     '7px',
                                  height:    '7px',
                                  background: '#fff',
                                  border:    '1.5px solid #2563eb',
                                  borderRadius: '2px',
                                  zIndex:    50,
                                }}
                              />
                              {/* Top-left handle */}
                              <div
                                style={{
                                  position:  'absolute',
                                  top:       '-4px',
                                  left:      '-4px',
                                  width:     '7px',
                                  height:    '7px',
                                  background: '#fff',
                                  border:    '1.5px solid #2563eb',
                                  borderRadius: '2px',
                                  zIndex:    50,
                                }}
                              />
                              {/* Top-right handle */}
                              <div
                                style={{
                                  position:  'absolute',
                                  top:       '-4px',
                                  right:     '-4px',
                                  width:     '7px',
                                  height:    '7px',
                                  background: '#fff',
                                  border:    '1.5px solid #2563eb',
                                  borderRadius: '2px',
                                  zIndex:    50,
                                }}
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Canvas tip */}
                <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                  🖱️ <strong>Drag</strong> to move · <strong>Blue handle</strong> to resize · <strong>Click empty area</strong> to deselect
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button 
                variant="secondary" 
                className="rounded-xl flex items-center gap-1.5"
                onClick={downloadStickerPdf}
              >
                <FiDownload /> Download PDF
              </Button>
              <Button 
                variant="primary" 
                className="rounded-xl flex items-center gap-1.5 px-6"
                onClick={() => {
                  setActivePrintSticker({
                    name: stickerName,
                    barcode: stickerBarcode,
                    price: Number(stickerPrice) || 0,
                    sku: stickerSku,
                    color: stickerColor,
                    size: stickerSize
                  });
                }}
              >
                <FiPrinter /> Print Label
              </Button>
              <Button variant="secondary" className="rounded-xl" onClick={() => setSelectedStickerProduct(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden Print Sticker Section */}
      {activePrintSticker && (
        <>
          <style>{`
            @media print {
              @page {
                size: ${stickerWidth}mm ${stickerHeight}mm;
                margin: 0;
              }
              .print-sticker-section {
                width: ${stickerWidth}mm !important;
                height: ${stickerHeight}mm !important;
              }
            }
          `}</style>
          <div className="print-sticker-section">
            <StickerPrintable 
              sticker={activePrintSticker} 
              shopSettings={shopSettings} 
              width={stickerWidth} 
              height={stickerHeight} 
              layout={layout}
            />
          </div>
        </>
      )}
    </div>
  );
};

// Subcomponent to render printable sticker inside hidden container
const StickerPrintable = ({ sticker, shopSettings, width, height, layout }) => {
  const barcodeSvgRef = useRef(null);

  useEffect(() => {
    if (barcodeSvgRef.current && sticker.barcode && layout.barcode) {
      try {
        const barcodeH = layout.barcode.h;
        const barcodeW = layout.barcode.w;
        // Calculate dynamic dimensions in pixels for JsBarcode (1mm = 3.78px)
        const barcodeHeightPx = Math.max(15, Math.min(150, (barcodeH / 100) * height * 3.78));
        const barcodeWidthPx = (barcodeW / 100) * width * 3.78;
        const barWidth = Math.max(0.8, Math.min(3.0, barcodeWidthPx / 100));

        JsBarcode(barcodeSvgRef.current, sticker.barcode, {
          format: "CODE128",
          width: barWidth,
          height: barcodeHeightPx,
          displayValue: false,
          margin: 0,
          background: "transparent",
          lineColor: "#000"
        });
      } catch (err) {
        console.error('PrintJsBarcode failed:', err);
      }
    }
  }, [sticker.barcode, height, width, layout.barcode]);

  const getElementText = (id) => {
    switch (id) {
      case 'shopName': return shopSettings?.name || 'Galaxy POS Shop';
      case 'price': return formatCurrency(sticker.price);
      case 'productName': return sticker.name;
      case 'sku': return sticker.sku ? `SKU: ${sticker.sku}` : '';
      case 'color': return sticker.color ? `COL: ${sticker.color}` : '';
      case 'size': return sticker.size ? `SZ: ${sticker.size}` : '';
      default: return '';
    }
  };

  const isElementVisible = (id) => {
    const el = layout[id];
    if (!el || !el.visible) return false;
    if (id === 'barcode') return true;
    return !!getElementText(id);
  };

  return (
    <div 
      className="relative bg-white text-black box-border overflow-hidden"
      style={{
        width:      `${width}mm`,
        height:     `${height}mm`,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {Object.keys(layout).map((id) => {
        if (!isElementVisible(id)) return null;
        const el   = layout[id];
        const text = getElementText(id);

        // Same formula as canvas preview: fontSize / 90 * height mm
        const computedFontSize = el.fontSize
          ? `${(el.fontSize / 90) * height}mm`
          : `${(el.h / 100) * height * 0.55}mm`;

        return (
          <div
            key={id}
            className="absolute box-border flex flex-col justify-center overflow-hidden"
            style={{
              left:        `${el.x}%`,
              top:         `${el.y}%`,
              width:       `${el.w}%`,
              height:      `${el.h}%`,
              textAlign:   el.align || 'center',
              fontSize:    computedFontSize,
              lineHeight:  '1.15',
              color:       '#000000',
              borderBottom: id === 'shopName' ? '0.1mm dashed #aaa' : undefined,
              borderTop:   (id === 'sku' || id === 'color' || id === 'size') ? '0.1mm solid #ccc' : undefined,
            }}
          >
            {id === 'barcode' ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <svg
                  ref={barcodeSvgRef}
                  style={{ maxHeight: '80%', maxWidth: '98%', display: 'block' }}
                />
                <span
                  style={{
                    fontFamily:    'monospace',
                    fontSize:      `${height * 0.045}mm`,
                    letterSpacing: '0.06em',
                    marginTop:     '0.3mm',
                    color:         '#000',
                    display:       'block',
                  }}
                >
                  {sticker.barcode}
                </span>
              </div>
            ) : (
              <span
                style={{
                  fontWeight:   el.fontWeight || 600,
                  whiteSpace:   'nowrap',
                  display:      'block',
                  width:        '100%',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  color:        '#000000',
                  paddingLeft:  '0.2mm',
                  paddingRight: '0.2mm',
                }}
              >
                {text}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Products;
