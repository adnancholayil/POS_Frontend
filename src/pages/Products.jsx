import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiBox, FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiAlertTriangle, FiCheckCircle, FiShare2, FiFolder
} from 'react-icons/fi';
import { productApi } from '../api/services';
import { TableCard } from '../components/ui/DataTable';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Input, Select, Checkbox, SearchInput } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/helpers';
import { PRODUCT_CATEGORIES } from '../utils/constants';

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
    </div>
  );
};
export default Products;
