import api from './axiosInstance';
import store from '../app/store';

// ─── Multipart helper ─────────────────────────────────────────────────────────
// Use this for any endpoint that receives a file upload (avatar, product image …)
const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

// Helper to get tenantId dynamically from the Redux store or localStorage
const getTenantId = () => {
  return store.getState().auth.tenantId || localStorage.getItem('tenantId') || '';
};

// Map backend product to UI product shape
const mapProductFromBackend = (p) => {
  const defaultVariant = p.variants?.[0] || {};
  return {
    id: p._id,
    name: p.name,
    sku: p.sku || defaultVariant.sku || '',
    barcode: p.barcode || '',
    category: p.category?.name || p.category || '',
    categoryId: p.category?._id || p.category || '',
    brand: p.brand?.name || p.brand || '',
    brandId: p.brand?._id || p.brand || '',
    price: p.price || defaultVariant.sellingPrice || 0,
    cost: p.cost || defaultVariant.costPrice || 0,
    stock: p.stock || 0,
    minStock: p.minStock || 0,
    imeiRequired: p.hasIMEI || false,
    imeiList: p.imeiList || []
  };
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', {
    email: data.email,
    password: data.password,
    tenantId: data.tenantId || getTenantId()
  }).then(res => {
    const user = res.data?.data?.user || {};
    const tenantId = user.tenantId || user._id;
    if (tenantId) {
      localStorage.setItem('tenantId', tenantId);
    }
    return {
      data: {
        user,
        accessToken: res.data?.data?.accessToken,
        tenantId
      }
    };
  }),

  register: (data) => api.post('/auth/register', {
    name: data.name,
    email: data.email,
    password: data.password,
    shopName: data.shopName || data.name + "'s Shop"
  }).then(res => {
    const registeredData = res.data?.data || {};
    const tenantId = registeredData.userId;
    if (tenantId) {
      localStorage.setItem('tenantId', tenantId);
    }
    return {
      data: {
        userId: registeredData.userId,
        email: registeredData.email,
        tenantId,
        message: res.data?.message || 'Registration successful. Please verify your email.'
      }
    };
  }),

  refresh: () => api.post('/auth/refresh-token', {}, { withCredentials: true }).then(res => ({
    data: {
      accessToken: res.data?.data?.accessToken || res.data?.accessToken
    }
  })),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (data) => api.post('/auth/forgot-password', {
    email: data.email,
    tenantId: data.tenantId || getTenantId()
  }),

  resetPassword: (data) => api.post('/auth/reset-password', {
    email: data.email,
    tenantId: data.tenantId || getTenantId(),
    otp: data.otp || data.token,
    newPassword: data.newPassword || data.password
  }),

  verifyEmail: (token) => api.get('/auth/verify-email', { params: { token } }),

  verifyOtp: (data) => api.post('/auth/verify-otp', {
    email: data.email,
    tenantId: data.tenantId || getTenantId(),
    otp: data.otp || data.token || data.code
  }),

  resendOtp: (data) => api.post('/auth/resend-verification', {
    email: data.email,
    tenantId: data.tenantId || getTenantId()
  }),

  getMe: () => api.get('/auth/me').then(res => ({
    data: res.data?.data || res.data
  })),

  updateProfile: (data) => api.patch('/users/profile', data).then(res => ({
    data: res.data?.data || res.data
  })),

  uploadAvatar: (formData) => api.patch('/users/avatar', formData, multipart).then(res => ({
    data: res.data?.data || res.data
  })),

  changePassword: (data) => api.post('/auth/change-password', data),
};

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const productApi = {
  getAll: async (params) => {
    const productsRes = await api.get('/products', { params });
    const inventoryRes = await api.get('/inventory', { params: { limit: 1000 } });
    
    const products = productsRes.data?.data?.products || [];
    const inventory = inventoryRes.data?.data?.items || [];
    
    const stockMap = {};
    const thresholdMap = {};
    const imeiMap = {};
    inventory.forEach(inv => {
      const prodId = inv.product?._id || inv.product;
      if (prodId) {
        stockMap[prodId] = inv.quantity || 0;
        thresholdMap[prodId] = inv.lowStockThreshold || 0;
        imeiMap[prodId] = inv.imeiList || [];
      }
    });
    
    return {
      data: products.map(p => {
        const mapped = mapProductFromBackend(p);
        mapped.stock = stockMap[p._id] || 0;
        mapped.minStock = thresholdMap[p._id] || 0;
        mapped.imeiList = imeiMap[p._id] || [];
        return mapped;
      })
    };
  },

  getById: async (id) => {
    const productRes = await api.get(`/products/${id}`);
    const inventoryRes = await api.get('/inventory', { params: { product: id } });
    const p = productRes.data?.data || productRes.data;
    const inv = inventoryRes.data?.data?.items?.[0] || {};
    
    const mapped = mapProductFromBackend(p);
    mapped.stock = inv.quantity || 0;
    mapped.minStock = inv.lowStockThreshold || 0;
    mapped.imeiList = inv.imeiList || [];
    return { data: mapped };
  },

  create: (data) => {
    const productData = { ...data };
    if (!productData.variants || productData.variants.length === 0) {
      productData.variants = [{
        color: 'Default',
        storage: 'Default',
        ram: 'Default',
        sellingPrice: data.price || 0,
        costPrice: data.cost || 0,
        sku: data.sku || 'SKU-' + Math.floor(Math.random() * 100000)
      }];
    }
    productData.price = data.price || 0;
    productData.cost = data.cost || 0;
    productData.hasIMEI = !!data.imeiRequired;
    return api.post('/products', productData);
  },

  createWithImage: (formData) => api.post('/products', formData, multipart),
  update: (id, data) => api.patch(`/products/${id}`, data),
  updateImage: (id, formData) => api.patch(`/products/${id}`, formData, multipart),
  delete: (id) => api.delete(`/products/${id}`),
  bulkImport: (data) => api.post('/products/bulk-import', data),
  bulkExport: (params) => api.get('/products/export', { params, responseType: 'blob' }),
  
  getCategories: () => api.get('/products/categories').then(res => {
    const list = res.data?.data || res.data || [];
    return {
      data: list.map(cat => cat.name || cat)
    };
  }),

  updateStock: (id, data) => api.post('/inventory/adjust', {
    productId: id,
    quantity: data.stock,
    reason: 'Manual adjustment'
  }),

  search: (q, params) => api.get('/products/search', { params: { q, ...params } }).then(res => {
    const list = res.data?.data || res.data || [];
    return {
      data: list.map(mapProductFromBackend)
    };
  }),

  getByBarcode: async (barcode) => {
    const res = await api.get(`/products/barcode/${barcode}`);
    const p = res.data?.data || res.data;
    if (!p) return null;
    
    let stock = 0;
    let imeiList = [];
    try {
      const inventoryRes = await api.get('/inventory', { params: { product: p._id } });
      const inv = inventoryRes.data?.data?.items?.[0] || {};
      stock = inv.quantity || 0;
      imeiList = inv.imeiList || [];
    } catch (err) {
      console.error('Error fetching inventory for product barcode scan', err);
    }
    
    const mapped = mapProductFromBackend(p);
    mapped.stock = stock;
    mapped.imeiList = imeiList;
    return { data: mapped };
  },
};

// ─── INVENTORY ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  getAll: (params) => api.get('/inventory', { params }).then(res => {
    const items = res.data?.data?.items || [];
    return {
      data: items.map(inv => {
        const prod = inv.product || {};
        const defaultVariant = prod.variants?.[0] || {};
        return {
          id: inv._id,
          productId: prod._id,
          sku: prod.sku || '',
          name: prod.name || 'Unknown Item',
          category: prod.category?.name || 'Accessories',
          stock: inv.quantity || 0,
          minStock: inv.lowStockThreshold || 0,
          cost: prod.cost || defaultVariant.costPrice || 0,
          value: (inv.quantity || 0) * (prod.price || defaultVariant.sellingPrice || 0),
          imeiList: inv.imeiList || []
        };
      })
    };
  }),

  stockIn: (data) => {
    const item = data.items?.[0] || {};
    return api.post('/inventory/stock-in', {
      productId: item.productId,
      quantity: Number(item.qty),
      reason: 'Procurement stock intake',
      imeiList: item.imeiList || []
    });
  },

  stockOut: (data) => {
    const item = data.items?.[0] || {};
    return api.post('/inventory/stock-out', {
      productId: item.productId,
      quantity: Number(item.qty),
      reason: data.reason || 'Stock deduction adjustment',
      imeiList: item.imeiList || []
    });
  },

  adjust: (data) => api.post('/inventory/adjust', data),

  getHistory: (params) => api.get('/inventory/history', { params }).then(res => {
    const list = res.data?.data?.movements || [];
    return {
      data: list.map(m => ({
        id: m._id,
        date: m.createdAt,
        type: m.type,
        name: m.product?.name || 'Unknown Product',
        qty: Math.abs(m.quantity),
        reference: m.reason || 'N/A',
        operator: m.performedBy?.name || 'Staff'
      }))
    };
  }),

  getLowStock: () => api.get('/inventory/low-stock').then(res => ({
    data: (res.data?.data || res.data || []).map(inv => {
      const prod = inv.product || {};
      return {
        id: inv._id,
        sku: prod.sku || '',
        name: prod.name || 'Unknown',
        stock: inv.quantity || 0,
        minStock: inv.lowStockThreshold || 0
      };
    })
  })),

  getDeadStock: () => Promise.resolve({ data: [] }),
  getAnalytics: () => Promise.resolve({ data: {} }),
};

// ─── SALES / POS ──────────────────────────────────────────────────────────────
export const salesApi = {
  checkout: async (data) => {
    let customerId = null;
    if (data.customerPhone) {
      try {
        const searchRes = await customerApi.search(data.customerPhone);
        const matched = searchRes.data?.[0];
        if (matched) {
          customerId = matched.id || matched._id;
        } else if (data.customerName && data.customerName !== 'Walk-in Customer') {
          const newCust = await customerApi.create({
            name: data.customerName,
            phone: data.customerPhone
          });
          customerId = newCust.data?._id || newCust.data?.id;
        }
      } catch (err) {
        console.error('Error finding/creating customer during checkout', err);
      }
    }

    const backendData = {
      customerName: data.customerName,
      customerId,
      paymentMethod: data.paymentMethod,
      discountAmount: data.discount || 0,
      taxAmount: data.tax || 0,
      subTotal: data.subtotal || 0,
      totalAmount: data.total || 0,
      items: data.items.map(it => ({
        productId: it.productId,
        productName: it.name,
        quantity: it.qty,
        unitPrice: it.price,
        imei: it.imei || null
      }))
    };
    return api.post('/sales', backendData);
  },

  getAll: (params) => api.get('/sales', { params }).then(res => {
    const list = res.data?.data?.sales || [];
    return {
      data: list.map(s => ({
        id: s._id,
        invoiceNo: s.invoiceNumber,
        createdAt: s.createdAt,
        customerName: s.customerName || 'Walk-in Customer',
        customerPhone: s.customer?.phone || '',
        paymentMethod: s.paymentMethod,
        total: s.totalAmount,
        subtotal: s.subTotal,
        tax: s.taxAmount,
        discount: s.discountAmount,
        items: [] // Will fetch on details demand or keep empty
      }))
    };
  }),

  getById: (id) => api.get(`/sales/${id}`).then(res => {
    const d = res.data?.data || {};
    const sale = d.sale || {};
    const items = d.items || [];
    return {
      data: {
        id: sale._id,
        invoiceNo: sale.invoiceNumber,
        createdAt: sale.createdAt,
        customerName: sale.customerName || 'Walk-in Customer',
        customerPhone: sale.customer?.phone || '',
        paymentMethod: sale.paymentMethod,
        total: sale.totalAmount,
        subtotal: sale.subTotal,
        tax: sale.taxAmount,
        discount: sale.discountAmount,
        items: items.map(it => ({
          productId: it.product,
          name: it.productName,
          price: it.unitPrice,
          qty: it.quantity,
          imei: it.imei || ''
        }))
      }
    };
  }),

  create: (data) => salesApi.checkout(data),
  return: (id, data) => api.post(`/sales/${id}/return`, data),
  getInvoice: (id) => api.get(`/sales/${id}/invoice`, { responseType: 'blob' }),
  applyCoupon: (data) => Promise.resolve({ data: { valid: false, discount: 0 } }),
  getHistory: (params) => salesApi.getAll(params),
  getDailySummary: (params) => Promise.resolve({ data: {} }),
};

// ─── REPAIRS ─────────────────────────────────────────────────────────────────
export const repairApi = {
  getAll: async (params) => {
    const res = await api.get('/repairs', { params });
    const list = res.data?.data?.repairs || [];
    
    const repairsWithParts = await Promise.all(list.map(async (r) => {
      let parts = [];
      try {
        const detailRes = await api.get(`/repairs/${r._id}`);
        const partsList = detailRes.data?.data?.parts || [];
        parts = partsList.map(p => ({
          id: p._id,
          name: p.productName,
          cost: p.unitPrice,
          qty: p.quantity
        }));
      } catch (err) {
        console.error('Error fetching parts for repair', r._id, err);
      }
      
      return {
        id: r._id,
        ticketNo: r.ticketNumber,
        deviceName: r.deviceModel,
        customerName: r.customer?.name || 'Walk-in Customer',
        customerPhone: r.customer?.phone || '',
        technicianId: r.assignedTechnician?._id || r.assignedTechnician || '',
        estimate: r.actualCost || r.estimatedCost || 0,
        status: r.status,
        serialOrImei: r.serialOrImei || '',
        issueDescription: r.issueDescription || '',
        parts,
        createdAt: r.createdAt
      };
    }));
    
    return { data: repairsWithParts };
  },

  getById: (id) => api.get(`/repairs/${id}`).then(res => {
    const r = res.data?.data?.repair || {};
    const parts = res.data?.data?.parts || [];
    return {
      data: {
        id: r._id,
        ticketNo: r.ticketNumber,
        deviceName: r.deviceModel,
        customerName: r.customer?.name || 'Walk-in Customer',
        customerPhone: r.customer?.phone || '',
        technicianId: r.assignedTechnician?._id || r.assignedTechnician || '',
        estimate: r.actualCost || r.estimatedCost || 0,
        status: r.status,
        serialOrImei: r.serialOrImei || '',
        issueDescription: r.issueDescription || '',
        parts: parts.map(p => ({
          id: p._id,
          name: p.productName,
          cost: p.unitPrice,
          qty: p.quantity
        })),
        createdAt: r.createdAt
      }
    };
  }),

  create: async (data) => {
    let customerId = null;
    if (data.customerPhone) {
      try {
        const searchRes = await customerApi.search(data.customerPhone);
        const matched = searchRes.data?.[0];
        if (matched) {
          customerId = matched._id || matched.id;
        } else {
          const newCust = await customerApi.create({
            name: data.customerName,
            phone: data.customerPhone
          });
          customerId = newCust.data?._id || newCust.data?.id;
        }
      } catch (err) {
        console.error('Error creating customer for repair ticket', err);
      }
    }

    const backendData = {
      customer: customerId,
      deviceType: 'other',
      deviceModel: data.deviceName,
      serialOrImei: data.serialOrImei || '',
      estimatedCost: Number(data.estimate || 0),
      assignedTechnician: data.technicianId || null,
      issueDescription: data.issueDescription,
      priority: 'normal'
    };
    return api.post('/repairs', backendData);
  },

  update: (id, data) => api.put(`/repairs/${id}`, data),
  updateStatus: (id, data) => api.patch(`/repairs/${id}/status`, data),
  delete: (id) => api.delete(`/repairs/${id}`),
  assignTechnician: (id, data) => api.put(`/repairs/${id}`, { assignedTechnician: data.technicianId }),

  addPart: async (id, part) => {
    let productId = null;
    try {
      const searchRes = await productApi.search(part.name);
      const matched = searchRes.data?.find(p => p.name.toLowerCase() === part.name.toLowerCase());
      if (matched) {
        productId = matched.id || matched._id;
      } else {
        const catsRes = await productApi.getCategories();
        const cats = catsRes.data || [];
        let categoryId = cats[0]?.id || cats[0]?._id;
        if (!categoryId) {
          const newCat = await api.post('/products/categories', { name: 'Spare Parts' });
          categoryId = newCat.data?.data?._id || newCat.data?._id;
        }
        
        const brandsRes = await api.get('/products/brands');
        const brands = brandsRes.data?.data || brandsRes.data || [];
        let brandId = brands[0]?.id || brands[0]?._id;
        if (!brandId) {
          const newBrand = await api.post('/products/brands', { name: 'Generic' });
          brandId = newBrand.data?.data?._id || newBrand.data?._id;
        }

        const newProd = await productApi.create({
          name: part.name,
          price: part.cost,
          cost: part.cost,
          category: categoryId,
          brand: brandId,
          productType: 'spare_part',
          hasIMEI: false
        });
        productId = newProd.data?.id || newProd.data?._id;
      }
    } catch (err) {
      console.error('Error finding/creating spare part product', err);
    }

    if (!productId) {
      throw new Error('Could not resolve spare part product ID');
    }

    return api.post(`/repairs/${id}/parts`, {
      productId,
      quantity: part.qty || 1
    });
  },

  addNote: (id, data) => api.patch(`/repairs/${id}/status`, { notes: data.note }),
  
  getStats: () => api.get('/repairs').then(res => {
    const list = res.data?.data?.repairs || [];
    return {
      data: {
        total: list.length,
        pending: list.filter(r => ['pending', 'diagnosing'].includes(r.status)).length,
        repairing: list.filter(r => r.status === 'repairing').length,
        ready: list.filter(r => r.status === 'ready').length,
        delivered: list.filter(r => r.status === 'delivered').length,
      }
    };
  }),
};

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
export const customerApi = {
  getAll: (params) => api.get('/customers', { params }).then(res => {
    const list = res.data?.data?.customers || [];
    return {
      data: list.map(c => ({
        id: c._id,
        name: c.name,
        phone: c.phone,
        email: c.email || '',
        points: Math.floor((c.totalSpent || 0) / 100),
        totalPurchases: c.totalPurchases || 0,
        totalRepairs: c.totalRepairs || 0,
        notes: c.notes || ''
      }))
    };
  }),

  getById: (id) => api.get(`/customers/${id}`).then(res => {
    const c = res.data?.data || {};
    return {
      data: {
        id: c._id,
        name: c.name,
        phone: c.phone,
        email: c.email || '',
        points: Math.floor((c.totalSpent || 0) / 100),
        totalPurchases: c.totalPurchases || 0,
        notes: c.notes || ''
      }
    };
  }),

  create: (data) => api.post('/customers', data),
  update: (id, data) => api.patch(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  
  getPurchaseHistory: (id) => api.get(`/customers/${id}/history`).then(res => ({
    data: (res.data?.data?.sales || []).map(s => ({
      id: s._id,
      invoiceNo: s.invoiceNumber,
      createdAt: s.createdAt,
      total: s.totalAmount
    }))
  })),

  getRepairHistory: (id) => api.get(`/customers/${id}/history`).then(res => ({
    data: (res.data?.data?.repairs || []).map(r => ({
      id: r._id,
      deviceName: r.deviceModel,
      ticketNo: r.ticketNumber,
      createdAt: r.createdAt,
      estimate: r.actualCost || r.estimatedCost || 0
    }))
  })),

  getWarrantyHistory: (id) => api.get(`/customers/${id}/history`).then(res => ({
    data: (res.data?.data?.warranties || []).map(w => ({
      id: w._id,
      invoiceNo: w.sale?.invoiceNumber || '',
      itemName: w.productName || 'Device',
      serialOrImei: w.imei || '',
      startDate: w.startDate,
      endDate: w.endDate,
      status: new Date() < new Date(w.endDate) ? 'active' : 'expired'
    }))
  })),

  addNote: (id, data) => api.patch(`/customers/${id}`, { notes: data.notes }).then(res => ({
    data: {
      id: res.data?.data?._id || id,
      name: res.data?.data?.name,
      phone: res.data?.data?.phone,
      email: res.data?.data?.email,
      points: Math.floor((res.data?.data?.totalSpent || 0) / 100),
      totalPurchases: res.data?.data?.totalPurchases || 0,
      notes: res.data?.data?.notes || ''
    }
  })),

  search: (q) => api.get('/customers/search', { params: { q } }).then(res => ({
    data: (res.data?.data || []).map(c => ({
      id: c._id,
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      points: Math.floor((c.totalSpent || 0) / 100),
      totalPurchases: c.totalPurchases || 0,
      notes: c.notes || ''
    }))
  })),
};

// ─── STAFF / USERS ────────────────────────────────────────────────────────────
export const staffApi = {
  getAll: (params) => api.get('/users', { params }).then(res => {
    const list = res.data?.data?.users || res.data?.data || [];
    return {
      data: list.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role?.name || u.role || 'salesman',
        phone: u.phone || '',
        status: u.status || 'active'
      }))
    };
  }),

  getById: (id) => api.get(`/users/${id}`).then(res => {
    const u = res.data?.data || {};
    return {
      data: {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role?.name || u.role || 'salesman',
        phone: u.phone || '',
        status: u.status || 'active'
      }
    };
  }),

  create: async (data) => {
    const roleName = data.role || 'salesman';
    let roleId = null;
    try {
      const rolesRes = await api.get('/roles');
      const roles = rolesRes.data?.data || rolesRes.data || [];
      const matched = roles.find(r => r.name === roleName);
      roleId = matched?._id || matched?.id;
    } catch (err) {
      console.error('Error fetching role ID for staff creation', err);
    }
    
    return api.post('/users', {
      name: data.name,
      email: data.email,
      password: 'TemporaryPassword123!', // Required by backend validation
      role: roleId || roleName,
      phone: data.phone
    });
  },

  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  uploadAvatar: (id, formData) => api.patch('/users/avatar', formData, multipart),
  
  getAttendance: (id, params) => api.get('/attendance', { params }).then(res => {
    const list = res.data?.data || [];
    return {
      data: list.filter(a => (a.user?._id || a.user) === id).map(a => ({
        date: a.date,
        status: a.status,
        checkIn: a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '—',
        checkOut: a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '—'
      }))
    };
  }),

  markAttendance: (data) => api.post('/attendance/check-in', data),
  getPerformance: (id, params) => Promise.resolve({
    data: {
      salesAmount: 145000,
      repairsCompleted: 18,
      tasksCompleted: 14,
      avgRating: 4.8
    }
  }),
};

// ─── TASKS ────────────────────────────────────────────────────────────────────
export const taskApi = {
  getAll: (params) => api.get('/tasks', { params }).then(res => {
    const list = res.data?.data || [];
    return {
      data: list.map(t => ({
        id: t._id,
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignedTo: t.assignedTo?._id || t.assignedTo || ''
      }))
    };
  }),

  getById: (id) => api.get(`/tasks/${id}`).then(res => {
    const t = res.data?.data || {};
    return {
      data: {
        id: t._id,
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignedTo: t.assignedTo?._id || t.assignedTo || ''
      }
    };
  }),

  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, data) => api.patch(`/tasks/${id}/status`, { status: data.status }),
  getAnalytics: () => Promise.resolve({ data: {} }),
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────
export const reportApi = {
  getSales: (params) => api.get('/reports/sales', { params }).then(res => ({
    data: {
      summary: res.data?.data?.summary || { totalSales: 0, taxCollected: 0, discountsGiven: 0, avgTicket: 0 },
      salesList: (res.data?.data?.sales || []).map(s => ({
        id: s._id,
        invoiceNo: s.invoiceNumber,
        createdAt: s.createdAt,
        customerName: s.customerName,
        total: s.totalAmount
      }))
    }
  })),

  getInventory: (params) => api.get('/reports/inventory-valuation', { params }).then(res => ({
    data: res.data?.data || {}
  })),

  getRepairs: (params) => api.get('/repairs', { params }).then(res => ({
    data: res.data?.data?.repairs || []
  })),

  getEmployees: (params) => api.get('/reports/staff-performance', { params }).then(res => ({
    data: res.data?.data || []
  })),

  getCustomers: (params) => customerApi.getAll(params),
  
  getProfit: (params) => api.get('/reports/profit', { params }).then(res => ({
    data: res.data?.data || {}
  })),

  getDashboard: () => api.get('/reports/overview').then(res => {
    const d = res.data?.data || {};
    return {
      data: {
        stats: {
          totalSales: d.totalSalesAmount || 0,
          totalEarnings: d.totalRevenue || 0,
          completedRepairs: d.completedRepairsCount || 0,
          totalProducts: d.totalProductsCount || 0,
          lowStockItems: d.lowStockCount || 0,
        },
        chartData: d.salesTrend || [
          { date: 'Mon', sales: 4000, repairs: 2400, profit: 2400 },
          { date: 'Tue', sales: 3000, repairs: 1398, profit: 2210 }
        ],
        recentSales: (d.recentSales || []).map(s => ({
          id: s._id,
          invoiceNo: s.invoiceNumber,
          customerName: s.customerName,
          total: s.totalAmount,
          createdAt: s.createdAt
        })),
        recentRepairs: (d.recentRepairs || []).map(r => ({
          id: r._id,
          ticketNo: r.ticketNumber,
          deviceName: r.deviceModel,
          customerName: r.customerName || 'Customer',
          estimate: r.estimatedCost || 0,
          status: r.status,
          createdAt: r.createdAt
        }))
      }
    };
  }),

  export: (type, params) => api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
};

// ─── WARRANTY ─────────────────────────────────────────────────────────────────
export const warrantyApi = {
  getAll: async () => {
    const salesRes = await salesApi.getAll({ limit: 1000 });
    const sales = salesRes.data || [];
    const warranties = [];
    
    sales.forEach(sale => {
      const items = sale.items || [];
      items.forEach(it => {
        const isEligible = it.imei || it.warrantyMonths > 0 || it.productName?.toLowerCase().includes('iphone') || it.productName?.toLowerCase().includes('galaxy') || it.productName?.toLowerCase().includes('macbook');
        if (isEligible) {
          const startDate = new Date(sale.createdAt);
          const endDate = new Date(startDate);
          endDate.setFullYear(startDate.getFullYear() + 1);
          
          warranties.push({
            id: 'w_' + sale.id + '_' + it.productId,
            invoiceNo: sale.invoiceNo,
            itemName: it.productName || it.name || 'Device',
            serialOrImei: it.imei || 'N/A',
            customerName: sale.customerName || 'Walk-in Customer',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: new Date() < endDate ? 'active' : 'expired'
          });
        }
      });
    });
    
    return { data: warranties };
  },

  getById: (id) => warrantyApi.getAll().then(res => ({
    data: res.data.find(w => w.id === id)
  })),

  create: (data) => Promise.resolve({ data }),
  update: (id, data) => Promise.resolve({ data }),
  
  getExpiring: (days) => warrantyApi.getAll().then(res => {
    const now = new Date();
    const limit = new Date();
    limit.setDate(now.getDate() + (days || 30));
    return {
      data: res.data.filter(w => {
        const end = new Date(w.endDate);
        return end > now && end <= limit;
      })
    };
  }),
};

// ─── SECOND-HAND DEVICES ──────────────────────────────────────────────────────
export const secondHandApi = {
  getAll: (params) => api.get('/used-devices', { params }).then(res => {
    const list = res.data?.data?.devices || [];
    return {
      data: list.map(d => ({
        id: d._id,
        deviceName: d.deviceModel,
        brand: d.deviceBrand || '',
        imei: d.serialOrImei || '',
        condition: d.condition,
        buyPrice: d.buyingPrice || 0,
        sellPrice: d.sellingPrice || null,
        status: d.status === 'sold' ? 'sold' : 'available',
        sellerName: d.sourcedFromName || '',
        sellerPhone: d.sellerPhone || '',
        repairDetails: d.evaluationNotes || ''
      }))
    };
  }),

  getById: (id) => api.get(`/used-devices/${id}`).then(res => {
    const d = res.data?.data || {};
    return {
      data: {
        id: d._id,
        deviceName: d.deviceModel,
        brand: d.deviceBrand || '',
        imei: d.serialOrImei || '',
        condition: d.condition,
        buyPrice: d.buyingPrice || 0,
        sellPrice: d.sellingPrice || null,
        status: d.status === 'sold' ? 'sold' : 'available',
        sellerName: d.sourcedFromName || '',
        sellerPhone: d.sellerPhone || '',
        repairDetails: d.evaluationNotes || ''
      }
    };
  }),

  buyDevice: async (data) => {
    let customerId = null;
    if (data.sellerPhone) {
      try {
        const searchRes = await customerApi.search(data.sellerPhone);
        const matched = searchRes.data?.[0];
        if (matched) {
          customerId = matched._id || matched.id;
        } else {
          const newCust = await customerApi.create({
            name: data.sellerName,
            phone: data.sellerPhone
          });
          customerId = newCust.data?._id || newCust.data?.id;
        }
      } catch (err) {
        console.error('Error linking customer to buyback device', err);
      }
    }

    const backendData = {
      deviceType: 'mobile',
      deviceModel: data.deviceName,
      deviceBrand: data.brand || '',
      serialOrImei: data.imei || '',
      condition: data.condition || 'good',
      buyingPrice: Number(data.buyPrice || 0),
      sourcedFrom: customerId,
      sourcedFromName: data.sellerName,
      evaluationNotes: data.repairDetails || ''
    };
    return api.post('/used-devices', backendData);
  },

  sellDevice: (id, data) => api.patch(`/used-devices/${id}/status`, { status: 'sold', sellingPrice: data.sellPrice }),
  
  evaluate: async (data) => {
    const originalPrice = Number(data.originalPrice) || 0;
    const condition = data.condition || 'good';
    let factor = 0.35;
    if (condition === 'excellent') factor = 0.45;
    else if (condition === 'good') factor = 0.35;
    else if (condition === 'fair') factor = 0.25;
    else if (condition === 'poor') factor = 0.15;
    else if (condition === 'damaged') factor = 0.05;
    const estimatedValue = Math.round(originalPrice * factor);
    return { data: { estimatedValue } };
  },

  update: (id, data) => api.put(`/used-devices/${id}`, data),
  delete: (id) => api.delete(`/used-devices/${id}`),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }).then(res => {
    const list = res.data?.data?.notifications || [];
    return {
      data: list.map(n => ({
        id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.isRead,
        createdAt: n.createdAt
      }))
    };
  }),

  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => Promise.resolve({ success: true }),
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export const settingsApi = {
  getShop: () => api.get('/settings').then(res => {
    const d = res.data?.data || {};
    return {
      data: {
        shopName: d.shopName || 'Galaxy Shop',
        shopAddress: d.shopAddress || '',
        shopEmail: d.shopEmail || '',
        defaultTaxRate: d.defaultTaxRate || 18,
        invoicePrefix: d.invoicePrefix || 'INV',
        repairPrefix: d.repairPrefix || 'REP'
      }
    };
  }),

  updateShop: (data) => api.put('/settings', data),
  uploadLogo: (formData) => Promise.resolve({ success: true }),
  getSecurity: () => Promise.resolve({ data: { twoFactorEnabled: false } }),
  updateSecurity: (data) => Promise.resolve({ success: true }),
  getReceiptConfig: () => Promise.resolve({ data: { headerText: 'Galaxy POS Shop', footerText: 'Thank you for shopping!' } }),
  updateReceipt: (data) => Promise.resolve({ success: true }),
};
