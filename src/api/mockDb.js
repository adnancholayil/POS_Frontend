import { PRODUCT_CATEGORIES, REPAIR_STATUS, TASK_STATUS, TASK_PRIORITY } from '../utils/constants';

// Helper to seed localStorage
const getOrSet = (key, defaultVal) => {
  const existing = localStorage.getItem(key);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      // ignore
    }
  }
  localStorage.setItem(key, JSON.stringify(defaultVal));
  return defaultVal;
};

// Initial Seed Data
const seedProducts = [
  { id: 'p1', name: 'iPhone 15 Pro Max 256GB', sku: 'IPH15PM-256', category: 'Smartphones', price: 139900, cost: 115000, stock: 12, minStock: 3, imeiRequired: true, imeiList: ['358762109876541', '358762109876542'] },
  { id: 'p2', name: 'Samsung Galaxy S24 Ultra', sku: 'SAMS24U-256', category: 'Smartphones', price: 129999, cost: 105000, stock: 8, minStock: 2, imeiRequired: true, imeiList: ['359218102345671', '359218102345672'] },
  { id: 'p3', name: 'MacBook Pro 14" M3 512GB', sku: 'MACBPRO-M3-512', category: 'Laptops', price: 169900, cost: 140000, stock: 5, minStock: 2, imeiRequired: false, serialNumber: 'C02F123XYZ45' },
  { id: 'p4', name: 'Anker PowerPort 65W Charger', sku: 'ANK-65W-CHG', category: 'Chargers', price: 2999, cost: 1800, stock: 45, minStock: 10, imeiRequired: false },
  { id: 'p5', name: 'USB-C to USB-C Cable 2m', sku: 'USBC-USBC-2M', category: 'Type-C Cables', price: 999, cost: 400, stock: 150, minStock: 20, imeiRequired: false },
  { id: 'p6', name: 'iPhone 13 Screen Assembly (OEM)', sku: 'SCR-IPH13-OEM', category: 'Screens', price: 7999, cost: 4500, stock: 2, minStock: 5, imeiRequired: false },
];

const seedRepairs = [
  { id: 'r1', ticketNo: 'TKT-2606-001', customerName: 'Rohan Sharma', customerPhone: '9876543210', deviceName: 'OnePlus 11R', serialOrImei: '861345091287653', issueDescription: 'Screen broken and touch unresponsive after dropping.', status: REPAIR_STATUS.REPAIRING, estimate: 8500, technicianId: 'staff2', parts: [{ name: 'OnePlus 11R Display', cost: 4200, qty: 1 }], notes: 'Customer approved repair estimate.', createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString() },
  { id: 'r2', ticketNo: 'TKT-2606-002', customerName: 'Priya Patel', customerPhone: '8765432109', deviceName: 'MacBook Air M1', serialOrImei: 'FVFDK987Q6W2', issueDescription: 'Liquid spill on keyboard, won\'t power on.', status: REPAIR_STATUS.DIAGNOSING, estimate: 25000, technicianId: 'staff1', parts: [], notes: 'Diagnosing logic board damage.', createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: 'r3', ticketNo: 'TKT-2606-003', customerName: 'Amit Verma', customerPhone: '7654321098', deviceName: 'iPhone 12', serialOrImei: '357812104598762', issueDescription: 'Battery health 74%. Needs replacement.', status: REPAIR_STATUS.READY, estimate: 3499, technicianId: 'staff2', parts: [{ name: 'iPhone 12 Battery OEM', cost: 1800, qty: 1 }], notes: 'Battery replaced, test cycle completed.', createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
];

const seedCustomers = [
  { id: 'c1', name: 'Rohan Sharma', phone: '9876543210', email: 'rohan.s@gmail.com', points: 450, totalPurchases: 2, totalRepairs: 1, notes: 'Prefers OEM parts for screen repairs.' },
  { id: 'c2', name: 'Priya Patel', phone: '8765432109', email: 'priya.patel@yahoo.com', points: 120, totalPurchases: 1, totalRepairs: 1, notes: 'Repeat corporate laptop buyer.' },
  { id: 'c3', name: 'Amit Verma', phone: '7654321098', email: 'amit.v@hotmail.com', points: 35, totalPurchases: 0, totalRepairs: 1, notes: '' },
];

const seedStaff = [
  { id: 'staff1', name: 'Rajesh Kumar', email: 'rajesh@zylox.com', role: 'admin', phone: '9000100010', status: 'active' },
  { id: 'staff2', name: 'Karan Malhotra', email: 'karan@zylox.com', role: 'manager', phone: '9000100020', status: 'active' },
  { id: 'staff3', name: 'Sunita Rao', email: 'sunita@zylox.com', role: 'salesman', phone: '9000100030', status: 'active' },
];

const seedTasks = [
  { id: 't1', title: 'Complete repair of OnePlus 11R', description: 'Replace screen and perform full diagnostics check.', status: TASK_STATUS.IN_PROGRESS, priority: TASK_PRIORITY.HIGH, dueDate: new Date(Date.now() + 86400000).toISOString(), assignedTo: 'staff2' },
  { id: 't2', title: 'Order iPhone 13 Screen Assemblies', description: 'Low stock alert triggers screen orders.', status: TASK_STATUS.PENDING, priority: TASK_PRIORITY.URGENT, dueDate: new Date().toISOString(), assignedTo: 'staff1' },
  { id: 't3', title: 'Update shop closing accounts', description: 'Reconcile daily cash register drawer.', status: TASK_STATUS.PENDING, priority: TASK_PRIORITY.MEDIUM, dueDate: new Date().toISOString(), assignedTo: 'staff3' },
];

const seedSales = [
  { id: 's1', invoiceNo: 'INV-2605-4321', customerName: 'Rohan Sharma', customerPhone: '9876543210', items: [{ productId: 'p1', name: 'iPhone 15 Pro Max 256GB', price: 139900, qty: 1, discount: 0, imei: '358762109876541' }], subtotal: 139900, tax: 25182, discount: 0, total: 165082, paymentMethod: 'upi', createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString() },
  { id: 's2', invoiceNo: 'INV-2606-1182', customerName: 'Priya Patel', customerPhone: '8765432109', items: [{ productId: 'p4', name: 'Anker PowerPort 65W Charger', price: 2999, qty: 2, discount: 10, imei: '' }], subtotal: 5398, tax: 971, discount: 599.8, total: 5769.2, paymentMethod: 'card', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
];

const seedSecondHand = [
  { id: 'sh1', deviceName: 'iPhone 12 Pro 128GB', brand: 'Apple', originalPrice: 119900, buyPrice: 32000, sellPrice: 48000, condition: 'good', imei: '356712098453210', status: 'available', sellerName: 'Vijay Negi', sellerPhone: '9988776655', repairDetails: 'Replaced battery (OEM)', createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString() },
  { id: 'sh2', deviceName: 'Dell XPS 13 9310', brand: 'Dell', originalPrice: 145000, buyPrice: 40000, sellPrice: null, condition: 'fair', imei: 'SN-XPS9310-4412', status: 'available', sellerName: 'Rohit Verma', sellerPhone: '8877665544', repairDetails: 'Needs keyboard replacement', createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString() },
];

const seedWarranties = [
  { id: 'w1', invoiceNo: 'INV-2605-4321', customerName: 'Rohan Sharma', customerPhone: '9876543210', itemSku: 'IPH15PM-256', itemName: 'iPhone 15 Pro Max 256GB', serialOrImei: '358762109876541', durationMonths: 12, startDate: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), endDate: new Date(Date.now() + 3600000 * 24 * 355).toISOString(), status: 'active' },
  { id: 'w2', invoiceNo: 'INV-2512-1002', customerName: 'Priya Patel', customerPhone: '8765432109', itemSku: 'MACBPRO-M3-512', itemName: 'MacBook Pro 14" M3 512GB', serialOrImei: 'C02F123XYZ45', durationMonths: 6, startDate: new Date(Date.now() - 3600000 * 24 * 170).toISOString(), endDate: new Date(Date.now() + 3600000 * 24 * 10).toISOString(), status: 'expiring' },
];

const seedNotifications = [
  { id: 1, title: 'Low Stock Alert', message: 'Anker PowerPort 65W Charger stock is low (45 left, min is 10)', type: 'stock_alert', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, title: 'New Repair Assigned', message: 'You have been assigned to Ticket TKT-2606-001 (OnePlus 11R)', type: 'task_alert', read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
];

// Initialize local DB lists
const db = {
  getProducts:   () => getOrSet('pos_products', seedProducts),
  saveProducts:  (data) => localStorage.setItem('pos_products', JSON.stringify(data)),

  getRepairs:    () => getOrSet('pos_repairs', seedRepairs),
  saveRepairs:   (data) => localStorage.setItem('pos_repairs', JSON.stringify(data)),

  getCustomers:  () => getOrSet('pos_customers', seedCustomers),
  saveCustomers: (data) => localStorage.setItem('pos_customers', JSON.stringify(data)),

  getStaff:      () => getOrSet('pos_staff', seedStaff),
  saveStaff:     (data) => localStorage.setItem('pos_staff', JSON.stringify(data)),

  getTasks:      () => getOrSet('pos_tasks', seedTasks),
  saveTasks:     (data) => localStorage.setItem('pos_tasks', JSON.stringify(data)),

  getSales:      () => getOrSet('pos_sales', seedSales),
  saveSales:     (data) => localStorage.setItem('pos_sales', JSON.stringify(data)),

  getSecondHand: () => getOrSet('pos_secondhand', seedSecondHand),
  saveSecondHand:(data) => localStorage.setItem('pos_secondhand', JSON.stringify(data)),

  getWarranties: () => getOrSet('pos_warranties', seedWarranties),
  saveWarranties:(data) => localStorage.setItem('pos_warranties', JSON.stringify(data)),

  getNotifications: () => getOrSet('pos_notifications', seedNotifications),
  saveNotifications:(data) => localStorage.setItem('pos_notifications', JSON.stringify(data)),
};

export const handleMockRequest = async (config) => {
  const { method, url, data: rawData, params } = config;
  const parsedData = rawData ? (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) : null;
  
  let cleanUrl = url || '';
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    try {
      cleanUrl = new URL(cleanUrl).pathname;
    } catch (e) {
      // ignore
    }
  }
  // Remove version prefix and query params
  cleanUrl = cleanUrl.replace(/^\/api\/v1/, '').replace(/^\/api/, '').split('?')[0];

  // Utility response helpers
  const ok = (data) => Promise.resolve({ status: 200, data, headers: {}, config });
  const created = (data) => Promise.resolve({ status: 201, data, headers: {}, config });
  const error = (status, message) => Promise.reject({ response: { status, data: { message } } });

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // --- AUTH ENDPOINTS ---
  if (cleanUrl === '/auth/login') {
    const { email, password } = parsedData || {};
    let selectedUser = null;
    if (email === 'admin@zylox.com') selectedUser = { id: 'staff1', name: 'Rajesh Kumar', email, role: 'admin' };
    else if (email === 'manager@zylox.com') selectedUser = { id: 'staff2', name: 'Karan Malhotra', email, role: 'manager' };
    else if (email === 'salesman@zylox.com') selectedUser = { id: 'staff3', name: 'Sunita Rao', email, role: 'salesman' };
    else {
      // Check if user is registered in local db
      const staff = db.getStaff();
      const localUser = staff.find(s => s.email === email);
      if (localUser) {
        selectedUser = { id: localUser.id, name: localUser.name, email: localUser.email, role: localUser.role };
      } else {
        selectedUser = { id: 'staff_guest', name: 'Guest Staff', email, role: 'salesman' }; // Fallback
      }
    }

    return ok({ user: selectedUser, token: 'mock_jwt_token_for_' + selectedUser.role });
  }

  if (cleanUrl === '/auth/register') {
    const { name, email, phone, role } = parsedData || {};
    const staff = db.getStaff();
    if (staff.some(s => s.email === email)) {
      return error(400, 'User with this email already exists');
    }
    const newUser = {
      id: 'staff_' + Date.now(),
      name: name || 'Registered User',
      email: email || 'user@zylox.com',
      role: role || 'admin',
      phone: phone || '',
      status: 'active'
    };
    staff.push(newUser);
    db.saveStaff(staff);
    return created({
      user: newUser,
      token: 'mock_jwt_token_for_' + newUser.role,
      message: 'Registration successful! Verification OTP sent to ' + (phone || email)
    });
  }

  if (cleanUrl === '/auth/forgot-password') {
    return ok({ message: 'Password reset OTP has been sent to your email.' });
  }

  if (cleanUrl === '/auth/reset-password') {
    return ok({ message: 'Password has been reset successfully. Please login.' });
  }

  if (cleanUrl.startsWith('/auth/verify-email/')) {
    return ok({ message: 'Email has been verified successfully.' });
  }

  if (cleanUrl === '/auth/verify-otp') {
    return ok({ message: 'OTP verified successfully.' });
  }

  if (cleanUrl === '/auth/resend-otp') {
    return ok({ message: 'OTP has been resent successfully.' });
  }

  if (cleanUrl === '/auth/me') {
    return ok({ id: 'staff1', name: 'Rajesh Kumar', email: 'admin@zylox.com', role: 'admin' });
  }

  if (cleanUrl === '/auth/profile') {
    return ok({ message: 'Profile updated successfully' });
  }

  if (cleanUrl === '/auth/profile/avatar') {
    return ok({ message: 'Avatar updated successfully', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80' });
  }

  if (cleanUrl === '/auth/change-password') {
    return ok({ message: 'Password changed successfully.' });
  }

  // --- PRODUCTS ENDPOINTS ---
  if (cleanUrl === '/products') {
    let list = db.getProducts();
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (params?.category) {
      list = list.filter(p => p.category === params.category);
    }
    return ok(list);
  }

  if (cleanUrl.startsWith('/products/')) {
    const id = cleanUrl.split('/')[2];
    const products = db.getProducts();

    if (method === 'get' && id === 'categories') {
      return ok(PRODUCT_CATEGORIES);
    }

    if (method === 'get') {
      const p = products.find(prod => prod.id === id);
      return p ? ok(p) : error(404, 'Product not found');
    }

    if (method === 'put' && cleanUrl.endsWith('/stock')) {
      const { quantity, type } = parsedData;
      const idx = products.findIndex(prod => prod.id === id);
      if (idx !== -1) {
        if (type === 'in') products[idx].stock += Number(quantity);
        else products[idx].stock = Math.max(0, products[idx].stock - Number(quantity));
        db.saveProducts(products);
        return ok(products[idx]);
      }
      return error(404, 'Product not found');
    }

    if (method === 'put') {
      const idx = products.findIndex(prod => prod.id === id);
      if (idx !== -1) {
        products[idx] = { ...products[idx], ...parsedData };
        db.saveProducts(products);
        return ok(products[idx]);
      }
      return error(404, 'Product not found');
    }

    if (method === 'delete') {
      const filtered = products.filter(prod => prod.id !== id);
      db.saveProducts(filtered);
      return ok({ success: true });
    }
  }

  if (cleanUrl === '/products' && method === 'post') {
    const products = db.getProducts();
    const newProduct = {
      id: 'p_' + Date.now(),
      name: parsedData.name,
      sku: parsedData.sku || 'SKU-' + Math.floor(Math.random() * 100000),
      category: parsedData.category || 'Smartphones',
      price: Number(parsedData.price),
      cost: Number(parsedData.cost),
      stock: Number(parsedData.stock || 0),
      minStock: Number(parsedData.minStock || 0),
      imeiRequired: !!parsedData.imeiRequired,
      imeiList: parsedData.imeiList || [],
    };
    products.push(newProduct);
    db.saveProducts(products);
    return created(newProduct);
  }

  // --- INVENTORY ENDPOINTS ---
  if (cleanUrl === '/inventory') {
    const products = db.getProducts();
    return ok(products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      stock: p.stock,
      minStock: p.minStock,
      cost: p.cost,
      value: p.stock * p.price,
    })));
  }

  if (cleanUrl === '/inventory/stock-in' && method === 'post') {
    const { items } = parsedData; // { productId, qty, cost, imeiList }
    const products = db.getProducts();
    items.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        p.stock += Number(item.qty);
        if (item.cost) p.cost = Number(item.cost);
        if (item.imeiList) p.imeiList = [...(p.imeiList || []), ...item.imeiList];
      }
    });
    db.saveProducts(products);
    return ok({ message: 'Stock received successfully' });
  }

  if (cleanUrl === '/inventory/stock-out' && method === 'post') {
    const { items, reason } = parsedData;
    const products = db.getProducts();
    items.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        p.stock = Math.max(0, p.stock - Number(item.qty));
        if (item.imeiList) {
          p.imeiList = (p.imeiList || []).filter(im => !item.imeiList.includes(im));
        }
      }
    });
    db.saveProducts(products);
    return ok({ message: 'Stock adjusted out successfully' });
  }

  if (cleanUrl === '/inventory/history') {
    const sales = db.getSales();
    const history = [];
    sales.forEach(sale => {
      sale.items.forEach(item => {
        history.push({
          id: 'ih_' + sale.id + '_' + item.productId,
          date: sale.createdAt,
          type: 'stock_out',
          name: item.name,
          productId: item.productId,
          qty: item.qty,
          reference: sale.invoiceNo,
          operator: 'Sales Checkout',
        });
      });
    });
    // Add dummy stock_in history
    history.push({
      id: 'ih_seed1',
      date: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
      type: 'stock_in',
      name: 'iPhone 15 Pro Max 256GB',
      productId: 'p1',
      qty: 15,
      reference: 'PO-2605-001',
      operator: 'Rajesh Kumar',
    });
    return ok(history);
  }

  if (cleanUrl === '/inventory/low-stock') {
    const products = db.getProducts();
    const low = products.filter(p => p.stock <= p.minStock);
    return ok(low);
  }

  // --- SALES ENDPOINTS ---
  if (cleanUrl === '/sales' || cleanUrl === '/sales/history') {
    return ok(db.getSales());
  }

  if (cleanUrl === '/sales' && method === 'post') {
    const sales = db.getSales();
    const products = db.getProducts();
    const customers = db.getCustomers();

    const invoiceNo = 'INV-' + new Date().getFullYear().toString().slice(-2) + 
      String(new Date().getMonth() + 1).padStart(2, '0') + '-' + 
      Math.floor(Math.random() * 9000 + 1000);

    const items = parsedData.items.map(item => {
      // Decrement product stock
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        p.stock = Math.max(0, p.stock - Number(item.qty));
        if (item.imei && p.imeiList) {
          p.imeiList = p.imeiList.filter(i => i !== item.imei);
        }
      }
      return { ...item };
    });

    db.saveProducts(products);

    // Update customer points if present
    if (parsedData.customerPhone) {
      const c = customers.find(cust => cust.phone === parsedData.customerPhone);
      if (c) {
        c.points += Math.floor(parsedData.total / 100);
        c.totalPurchases += 1;
      } else {
        customers.push({
          id: 'c_' + Date.now(),
          name: parsedData.customerName || 'Walk-in Customer',
          phone: parsedData.customerPhone,
          email: '',
          points: Math.floor(parsedData.total / 100),
          totalPurchases: 1,
          totalRepairs: 0,
          notes: '',
        });
      }
      db.saveCustomers(customers);
    }

    const newSale = {
      id: 's_' + Date.now(),
      invoiceNo,
      customerName: parsedData.customerName || 'Walk-in Customer',
      customerPhone: parsedData.customerPhone || '',
      items,
      subtotal: parsedData.subtotal,
      tax: parsedData.tax || 0,
      discount: parsedData.discount || 0,
      total: parsedData.total,
      paymentMethod: parsedData.paymentMethod || 'cash',
      createdAt: new Date().toISOString(),
    };

    sales.push(newSale);
    db.saveSales(sales);

    // Auto-create active warranty if mobile/laptop
    const warranties = db.getWarranties();
    items.forEach(it => {
      const prod = products.find(p => p.id === it.productId);
      if (prod && (prod.category === 'Smartphones' || prod.category === 'Laptops')) {
        warranties.push({
          id: 'w_' + Date.now() + Math.random().toString().slice(-4),
          invoiceNo,
          customerName: newSale.customerName,
          customerPhone: newSale.customerPhone,
          itemSku: prod.sku,
          itemName: prod.name,
          serialOrImei: it.imei || prod.serialNumber || 'N/A',
          durationMonths: 12,
          startDate: newSale.createdAt,
          endDate: new Date(Date.now() + 365 * 24 * 3600000).toISOString(),
          status: 'active',
        });
      }
    });
    db.saveWarranties(warranties);

    return created(newSale);
  }

  // --- REPAIRS ENDPOINTS ---
  if (cleanUrl === '/repairs') {
    return ok(db.getRepairs());
  }

  if (cleanUrl === '/repairs/stats') {
    const list = db.getRepairs();
    const stats = {
      total: list.length,
      pending: list.filter(r => [REPAIR_STATUS.RECEIVED, REPAIR_STATUS.DIAGNOSING].includes(r.status)).length,
      repairing: list.filter(r => r.status === REPAIR_STATUS.REPAIRING).length,
      ready: list.filter(r => r.status === REPAIR_STATUS.READY).length,
      delivered: list.filter(r => r.status === REPAIR_STATUS.DELIVERED).length,
    };
    return ok(stats);
  }

  if (cleanUrl.startsWith('/repairs/')) {
    const id = cleanUrl.split('/')[2];
    const repairs = db.getRepairs();

    if (method === 'get') {
      const r = repairs.find(rep => rep.id === id);
      return r ? ok(r) : error(404, 'Ticket not found');
    }

    if (method === 'put' && cleanUrl.endsWith('/status')) {
      const idx = repairs.findIndex(rep => rep.id === id);
      if (idx !== -1) {
        repairs[idx].status = parsedData.status;
        db.saveRepairs(repairs);
        return ok(repairs[idx]);
      }
      return error(404, 'Ticket not found');
    }

    if (method === 'put' && cleanUrl.endsWith('/assign')) {
      const idx = repairs.findIndex(rep => rep.id === id);
      if (idx !== -1) {
        repairs[idx].technicianId = parsedData.technicianId;
        db.saveRepairs(repairs);
        return ok(repairs[idx]);
      }
      return error(404, 'Ticket not found');
    }

    if (method === 'post' && cleanUrl.endsWith('/parts')) {
      const idx = repairs.findIndex(rep => rep.id === id);
      if (idx !== -1) {
        const part = { name: parsedData.name, cost: Number(parsedData.cost), qty: Number(parsedData.qty || 1) };
        repairs[idx].parts = [...(repairs[idx].parts || []), part];
        repairs[idx].estimate += part.cost * part.qty;
        db.saveRepairs(repairs);
        return ok(repairs[idx]);
      }
      return error(404, 'Ticket not found');
    }

    if (method === 'put') {
      const idx = repairs.findIndex(rep => rep.id === id);
      if (idx !== -1) {
        repairs[idx] = { ...repairs[idx], ...parsedData };
        db.saveRepairs(repairs);
        return ok(repairs[idx]);
      }
      return error(404, 'Ticket not found');
    }

    if (method === 'delete') {
      const filtered = repairs.filter(rep => rep.id !== id);
      db.saveRepairs(filtered);
      return ok({ success: true });
    }
  }

  if (cleanUrl === '/repairs' && method === 'post') {
    const repairs = db.getRepairs();
    const ticketNo = 'TKT-' + new Date().getFullYear().toString().slice(-2) + 
      String(new Date().getMonth() + 1).padStart(2, '0') + '-' + 
      String(repairs.length + 1).padStart(3, '0');

    const newRepair = {
      id: 'r_' + Date.now(),
      ticketNo,
      customerName: parsedData.customerName,
      customerPhone: parsedData.customerPhone,
      deviceName: parsedData.deviceName,
      serialOrImei: parsedData.serialOrImei || '',
      issueDescription: parsedData.issueDescription,
      status: REPAIR_STATUS.RECEIVED,
      estimate: Number(parsedData.estimate || 0),
      technicianId: parsedData.technicianId || '',
      parts: [],
      notes: parsedData.notes || '',
      createdAt: new Date().toISOString(),
    };
    repairs.push(newRepair);
    db.saveRepairs(repairs);
    return created(newRepair);
  }

  // --- CUSTOMERS ENDPOINTS ---
  if (cleanUrl === '/customers') {
    return ok(db.getCustomers());
  }

  if (cleanUrl.startsWith('/customers/')) {
    const id = cleanUrl.split('/')[2];
    const customers = db.getCustomers();

    if (method === 'get' && cleanUrl.endsWith('/purchases')) {
      const sales = db.getSales();
      const customer = customers.find(c => c.id === id);
      const userSales = sales.filter(s => s.customerPhone === customer?.phone);
      return ok(userSales);
    }

    if (method === 'get' && cleanUrl.endsWith('/repairs')) {
      const repairs = db.getRepairs();
      const customer = customers.find(c => c.id === id);
      const userRepairs = repairs.filter(r => r.customerPhone === customer?.phone);
      return ok(userRepairs);
    }

    if (method === 'get' && cleanUrl.endsWith('/warranties')) {
      const warranties = db.getWarranties();
      const customer = customers.find(c => c.id === id);
      const userWarranties = warranties.filter(w => w.customerPhone === customer?.phone);
      return ok(userWarranties);
    }

    if (method === 'post' && cleanUrl.endsWith('/notes')) {
      const idx = customers.findIndex(c => c.id === id);
      if (idx !== -1) {
        customers[idx].notes = parsedData.notes;
        db.saveCustomers(customers);
        return ok(customers[idx]);
      }
      return error(404, 'Customer not found');
    }

    if (method === 'get') {
      const c = customers.find(cust => cust.id === id);
      return c ? ok(c) : error(404, 'Customer not found');
    }

    if (method === 'put') {
      const idx = customers.findIndex(cust => cust.id === id);
      if (idx !== -1) {
        customers[idx] = { ...customers[idx], ...parsedData };
        db.saveCustomers(customers);
        return ok(customers[idx]);
      }
      return error(404, 'Customer not found');
    }

    if (method === 'delete') {
      const filtered = customers.filter(cust => cust.id !== id);
      db.saveCustomers(filtered);
      return ok({ success: true });
    }
  }

  if (cleanUrl === '/customers' && method === 'post') {
    const customers = db.getCustomers();
    const newCust = {
      id: 'c_' + Date.now(),
      name: parsedData.name,
      phone: parsedData.phone,
      email: parsedData.email || '',
      points: 0,
      totalPurchases: 0,
      totalRepairs: 0,
      notes: parsedData.notes || '',
    };
    customers.push(newCust);
    db.saveCustomers(customers);
    return created(newCust);
  }

  // --- STAFF ENDPOINTS ---
  if (cleanUrl === '/staff') {
    return ok(db.getStaff());
  }

  if (cleanUrl.startsWith('/staff/')) {
    const id = cleanUrl.split('/')[2];
    const staff = db.getStaff();

    if (method === 'get' && cleanUrl.endsWith('/attendance')) {
      // Mock attendance calendar
      return ok([
        { date: '2026-06-01', status: 'present', checkIn: '09:15 AM', checkOut: '07:30 PM' },
        { date: '2026-06-02', status: 'present', checkIn: '09:05 AM', checkOut: '07:35 PM' },
        { date: '2026-06-03', status: 'present', checkIn: '09:10 AM', checkOut: '07:15 PM' },
        { date: '2026-06-04', status: 'present', checkIn: '09:25 AM', checkOut: '07:40 PM' },
        { date: '2026-06-05', status: 'absent', checkIn: '—', checkOut: '—' },
      ]);
    }

    if (method === 'get' && cleanUrl.endsWith('/performance')) {
      return ok({
        salesAmount: id === 'staff3' ? 145000 : 25000,
        repairsCompleted: id === 'staff2' ? 18 : 2,
        tasksCompleted: 14,
        avgRating: 4.8,
      });
    }

    if (method === 'get') {
      const s = staff.find(st => st.id === id);
      return s ? ok(s) : error(404, 'Staff not found');
    }

    if (method === 'put') {
      const idx = staff.findIndex(st => st.id === id);
      if (idx !== -1) {
        staff[idx] = { ...staff[idx], ...parsedData };
        db.saveStaff(staff);
        return ok(staff[idx]);
      }
      return error(404, 'Staff not found');
    }

    if (method === 'delete') {
      const filtered = staff.filter(st => st.id !== id);
      db.saveStaff(filtered);
      return ok({ success: true });
    }
  }

  if (cleanUrl === '/staff/attendance' && method === 'post') {
    return ok({ message: 'Attendance clocked successfully' });
  }

  if (cleanUrl === '/staff' && method === 'post') {
    const staff = db.getStaff();
    const newStaff = {
      id: 'staff_' + Date.now(),
      name: parsedData.name,
      email: parsedData.email,
      role: parsedData.role || 'salesman',
      phone: parsedData.phone,
      status: 'active',
    };
    staff.push(newStaff);
    db.saveStaff(staff);
    return created(newStaff);
  }

  // --- TASKS ENDPOINTS ---
  if (cleanUrl === '/tasks') {
    return ok(db.getTasks());
  }

  if (cleanUrl.startsWith('/tasks/')) {
    const id = cleanUrl.split('/')[2];
    const tasks = db.getTasks();

    if (method === 'put' && cleanUrl.endsWith('/status')) {
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        tasks[idx].status = parsedData.status;
        db.saveTasks(tasks);
        return ok(tasks[idx]);
      }
      return error(404, 'Task not found');
    }

    if (method === 'put') {
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        tasks[idx] = { ...tasks[idx], ...parsedData };
        db.saveTasks(tasks);
        return ok(tasks[idx]);
      }
      return error(404, 'Task not found');
    }

    if (method === 'delete') {
      const filtered = tasks.filter(t => t.id !== id);
      db.saveTasks(filtered);
      return ok({ success: true });
    }
  }

  if (cleanUrl === '/tasks' && method === 'post') {
    const tasks = db.getTasks();
    const newTask = {
      id: 't_' + Date.now(),
      title: parsedData.title,
      description: parsedData.description || '',
      status: TASK_STATUS.PENDING,
      priority: parsedData.priority || TASK_PRIORITY.MEDIUM,
      dueDate: parsedData.dueDate || new Date(Date.now() + 86400000).toISOString(),
      assignedTo: parsedData.assignedTo || 'staff1',
    };
    tasks.push(newTask);
    db.saveTasks(tasks);
    return created(newTask);
  }

  // --- REPORTS & DASHBOARD ENDPOINTS ---
  if (cleanUrl === '/reports/dashboard') {
    const sales = db.getSales();
    const repairs = db.getRepairs();
    const products = db.getProducts();

    const salesTotal = sales.reduce((sum, s) => sum + s.total, 0);
    const repairEarnings = repairs.reduce((sum, r) => sum + (r.status === REPAIR_STATUS.DELIVERED ? r.estimate : 0), 0);
    const totalEarnings = salesTotal + repairEarnings;

    const completedRepairs = repairs.filter(r => r.status === REPAIR_STATUS.DELIVERED).length;

    // Daily sales stats for chart
    const chartData = [
      { date: '01 Jun', sales: 45000, repairs: 8500, profit: 12000 },
      { date: '02 Jun', sales: 68000, repairs: 12000, profit: 18500 },
      { date: '03 Jun', sales: 52000, repairs: 9500, profit: 14000 },
      { date: '04 Jun', sales: 91000, repairs: 14500, profit: 25000 },
      { date: '05 Jun', sales: 74000, repairs: 11000, profit: 21000 },
      { date: '06 Jun', sales: 115000, repairs: 19000, profit: 32000 },
      { date: '07 Jun', sales: 125000, repairs: 24000, profit: 35000 },
    ];

    return ok({
      stats: {
        totalSales: salesTotal,
        totalEarnings,
        completedRepairs,
        totalProducts: products.length,
        lowStockItems: products.filter(p => p.stock <= p.minStock).length,
      },
      chartData,
      recentSales: sales.slice(-5).reverse(),
      recentRepairs: repairs.slice(-5).reverse(),
    });
  }

  if (cleanUrl === '/reports/sales') {
    const sales = db.getSales();
    return ok({
      summary: {
        totalSales: sales.reduce((sum, s) => sum + s.total, 0),
        taxCollected: sales.reduce((sum, s) => sum + s.tax, 0),
        discountsGiven: sales.reduce((sum, s) => sum + s.discount, 0),
        avgTicket: sales.length ? sales.reduce((sum, s) => sum + s.total, 0) / sales.length : 0,
      },
      salesList: sales,
    });
  }

  if (cleanUrl === '/reports/profit') {
    return ok({
      netProfit: 120000,
      grossProfit: 185000,
      expenses: 65000,
      profitHistory: [
        { month: 'Jan', profit: 90000, revenue: 320000 },
        { month: 'Feb', profit: 105000, revenue: 380000 },
        { month: 'Mar', profit: 85000, revenue: 300000 },
        { month: 'Apr', profit: 110000, revenue: 410000 },
        { month: 'May', profit: 115000, revenue: 420000 },
        { month: 'Jun', profit: 120000, revenue: 450000 },
      ],
    });
  }

  // --- SECOND-HAND ---
  if (cleanUrl === '/second-hand') {
    return ok(db.getSecondHand());
  }

  if (cleanUrl === '/second-hand/buy' && method === 'post') {
    const items = db.getSecondHand();
    const newItem = {
      id: 'sh_' + Date.now(),
      deviceName: parsedData.deviceName,
      brand: parsedData.brand || 'Apple',
      originalPrice: Number(parsedData.originalPrice || 0),
      buyPrice: Number(parsedData.buyPrice),
      sellPrice: null,
      condition: parsedData.condition || 'good',
      imei: parsedData.imei || '',
      status: 'available',
      sellerName: parsedData.sellerName,
      sellerPhone: parsedData.sellerPhone,
      repairDetails: parsedData.repairDetails || '',
      createdAt: new Date().toISOString(),
    };
    items.push(newItem);
    db.saveSecondHand(items);
    return created(newItem);
  }

  if (cleanUrl.startsWith('/second-hand/')) {
    const id = cleanUrl.split('/')[2];
    const items = db.getSecondHand();

    if (method === 'put' && cleanUrl.endsWith('/sell')) {
      const idx = items.findIndex(it => it.id === id);
      if (idx !== -1) {
        items[idx].sellPrice = Number(parsedData.sellPrice);
        items[idx].status = 'sold';
        db.saveSecondHand(items);
        return ok(items[idx]);
      }
      return error(404, 'Device not found');
    }

    if (method === 'delete') {
      const filtered = items.filter(it => it.id !== id);
      db.saveSecondHand(filtered);
      return ok({ success: true });
    }
  }

  if (cleanUrl === '/second-hand/evaluate' && method === 'post') {
    const { originalPrice, condition } = parsedData;
    const rateMap = { excellent: 0.45, good: 0.35, fair: 0.25, poor: 0.15, damaged: 0.05 };
    const rate = rateMap[condition] || 0.3;
    const estVal = Math.round(Number(originalPrice) * rate);
    return ok({ estimatedValue: estVal });
  }

  // --- WARRANTY ---
  if (cleanUrl === '/warranties') {
    return ok(db.getWarranties());
  }

  if (cleanUrl === '/warranties/expiring') {
    const days = params?.days || 30;
    const list = db.getWarranties();
    const filtered = list.filter(w => {
      const daysLeft = Math.ceil((new Date(w.endDate).getTime() - Date.now()) / (1000 * 3600 * 24));
      return daysLeft > 0 && daysLeft <= days;
    });
    return ok(filtered);
  }

  // --- SETTINGS ---
  if (cleanUrl === '/settings/shop') {
    const shop = getOrSet('pos_shop_settings', {
      name: 'Galaxy Mobiles & Laptops',
      address: '102 Tech Plaza, Sector-18, Noida, UP, 201301',
      phone: '9988776655',
      email: 'support@zylox.com',
      gstin: '09AAAFZ1234F1Z1',
      terms: '1. Goods once sold cannot be taken back or exchanged without valid warranty claim.\n2. Warranty covers manufacturing defects only.\n3. Repair parts warranty is 90 days.'
    });
    return ok(shop);
  }

  if (cleanUrl === '/settings/shop' && method === 'put') {
    localStorage.setItem('pos_shop_settings', JSON.stringify(parsedData));
    return ok(parsedData);
  }

  // --- NOTIFICATIONS ---
  if (cleanUrl === '/notifications') {
    return ok(db.getNotifications());
  }

  if (cleanUrl === '/notifications/read-all' && method === 'put') {
    const notifications = db.getNotifications();
    notifications.forEach(n => n.read = true);
    db.saveNotifications(notifications);
    return ok({ success: true });
  }

  if (cleanUrl.startsWith('/notifications/') && method === 'put' && cleanUrl.endsWith('/read')) {
    const id = Number(cleanUrl.split('/')[2]);
    const notifications = db.getNotifications();
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifications[idx].read = true;
      db.saveNotifications(notifications);
      return ok(notifications[idx]);
    }
    return error(404, 'Notification not found');
  }

  if (cleanUrl.startsWith('/notifications/') && method === 'delete') {
    const id = Number(cleanUrl.split('/')[2]);
    const notifications = db.getNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    db.saveNotifications(filtered);
    return ok({ success: true });
  }

  return error(404, `Endpoint ${method.toUpperCase()} ${cleanUrl} not implemented in mock DB`);
};
