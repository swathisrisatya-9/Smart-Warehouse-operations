/**
 * SmartWarehouse AI - Central State Store & Event Bus
 * Provides reactive event publishing, LocalStorage persistence, and CRUD mutations.
 */

class WarehouseStateStore {
  constructor() {
    this.STORAGE_KEY = 'SMART_WAREHOUSE_STATE_V1';
    this.subscribers = {};
    this.currentRole = 'manager'; // 'manager' | 'picker'
    this.currentTheme = 'dark'; // 'dark' | 'light'
    this.activeTab = 'dashboard';
    this.notifications = [];
    this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.data = JSON.parse(saved);
      } else {
        this.resetToDefault();
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage, using initial dataset:', e);
      this.resetToDefault();
    }

    // Load saved preferences
    this.currentRole = localStorage.getItem('SW_ROLE') || 'manager';
    this.currentTheme = localStorage.getItem('SW_THEME') || 'dark';

    // Populate initial notifications if empty
    if (!this.notifications || this.notifications.length === 0) {
      this.initInitialNotifications();
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }

  resetToDefault() {
    // Deep clone INITIAL_WAREHOUSE_DATA
    this.data = JSON.parse(JSON.stringify(INITIAL_WAREHOUSE_DATA));
    this.saveState();
    this.initInitialNotifications();
    this.emit('state:reset', this.data);
  }

  initInitialNotifications() {
    this.notifications = [
      {
        id: 'NOTIF-1',
        type: 'critical',
        title: 'SLA Breach Warning',
        message: 'Order ORD-9011 (VIP Enterprise) has only 1.5 hours remaining before SLA breach!',
        timestamp: 'Just now',
        read: false,
        actionUrl: 'orders',
        targetId: 'ORD-9011'
      },
      {
        id: 'NOTIF-2',
        type: 'warning',
        title: 'Critical Stock Shortage',
        message: 'Active Studio Headphones (SKU-ELEC-003) is 100% reserved. Available stock is 0.',
        timestamp: '5m ago',
        read: false,
        actionUrl: 'inventory',
        targetId: 'SKU-ELEC-003'
      },
      {
        id: 'NOTIF-3',
        type: 'info',
        title: 'Damaged Item Exception',
        message: 'Elena reported 1 torn seam on Trail Jacket (SKU-APP-003) in Bin B1-02.',
        timestamp: '15m ago',
        read: false,
        actionUrl: 'exceptions',
        targetId: 'EXC-4091'
      },
      {
        id: 'NOTIF-4',
        type: 'warning',
        title: 'Packing Station Bottleneck',
        message: 'Average packing dwell time is 19.8 min (3.3x above baseline). Action recommended.',
        timestamp: '30m ago',
        read: true,
        actionUrl: 'analytics'
      }
    ];
  }

  // --- Pub/Sub Event System ---
  on(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.subscribers[event]) return;
    this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
  }

  emit(event, payload) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in subscriber for ${event}:`, err);
        }
      });
    }
    // Also emit global change
    if (event !== 'state:change' && !event.startsWith('ui:')) {
      if (this.subscribers['state:change']) {
        this.subscribers['state:change'].forEach(cb => cb({ event, payload }));
      }
    }
  }

  // --- Core State Mutators ---

  // Products
  getProducts() {
    return this.data.products || [];
  }

  getProductBySku(sku) {
    return this.getProducts().find(p => p.sku === sku);
  }

  updateProductStock(sku, deltaAvailable, reason = 'Adjustment', user = 'User') {
    const p = this.getProductBySku(sku);
    if (!p) return null;

    p.quantity += deltaAvailable;
    p.available = Math.max(0, p.quantity - p.reserved);

    // Record history
    const sign = deltaAvailable >= 0 ? `+${deltaAvailable}` : `${deltaAvailable}`;
    p.history.unshift({
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      change: sign,
      type: reason,
      user: user
    });

    this.saveState();
    this.emit('inventory:updated', { product: p, sku, deltaAvailable, reason });
    return p;
  }

  // Orders
  getOrders() {
    return this.data.orders || [];
  }

  getOrderById(id) {
    return this.getOrders().find(o => o.id === id);
  }

  updateOrderStatus(orderId, newStatus, note = '') {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    const oldStatus = order.status;
    order.status = newStatus;

    // Update lifecycle
    const stageMap = {
      'Pending Allocation': 'Stock Allocated',
      'Allocated': 'Stock Allocated',
      'Picking': 'Picking',
      'Packing': 'Packing',
      'Quality Check': 'Quality Check',
      'Dispatched': 'Dispatched',
      'Delivered': 'Dispatched'
    };

    const targetStageName = stageMap[newStatus] || newStatus;
    const stageIndex = order.lifecycle.findIndex(l => l.stage.toLowerCase() === targetStageName.toLowerCase());
    
    if (stageIndex >= 0) {
      for (let i = 0; i <= stageIndex; i++) {
        order.lifecycle[i].completed = true;
        if (!order.lifecycle[i].timestamp) {
          order.lifecycle[i].timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
        }
      }
      if (note) {
        order.lifecycle[stageIndex].note = note;
      }
    }

    this.saveState();
    this.emit('order:statusChanged', { order, oldStatus, newStatus, note });
    return order;
  }

  overrideOrderPriority(orderId, newScore, reason) {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.priorityScore = parseInt(newScore, 10);
    order.manualOverride = true;
    order.overrideReason = reason;
    order.priorityReason = `⚙️ Manual Override (${newScore} pts): "${reason}"`;

    this.logDecision({
      category: 'Manual Priority Override',
      title: `Priority Score overridden for ${orderId}`,
      whatHappened: `Priority score updated to ${newScore} by Warehouse Manager.`,
      whyItHappened: `Reason specified: "${reason}"`,
      systemRecommendation: 'Re-evaluate allocation queue with the new priority ranking.',
      status: 'Completed'
    });

    this.saveState();
    this.emit('order:priorityOverridden', { order, newScore, reason });
    return order;
  }

  // Exceptions
  getExceptions() {
    return this.data.exceptions || [];
  }

  reportException({ orderId, sku, qtyAffected, reasonType, severity, reportedBy, notes }) {
    const product = this.getProductBySku(sku);
    const excId = `EXC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newException = {
      id: excId,
      orderId: orderId || 'N/A',
      sku: sku,
      productName: product ? product.name : sku,
      binLocation: product ? product.binLocation : 'Zone A',
      qtyAffected: parseInt(qtyAffected, 10) || 1,
      reportedBy: reportedBy || 'Floor Specialist',
      reportedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reasonType: reasonType || 'Damaged in Bin',
      severity: severity || 'High',
      status: 'Open',
      systemRecommendation: `Quarantine ${qtyAffected} unit(s), decrement physical available stock, and check substitute availability for affected order ${orderId || ''}.`,
      actionTaken: notes || null
    };

    // Decrement physical stock
    if (product) {
      this.updateProductStock(sku, -newException.qtyAffected, `Damaged Exception (${excId})`, reportedBy);
    }

    // If order was in picking/packing, flag order status
    if (orderId && orderId !== 'N/A') {
      const order = this.getOrderById(orderId);
      if (order) {
        order.status = 'Exception';
        order.allocationStatus = 'Exception - Stock Damage';
        order.priorityReason = `🚨 Damaged Item Exception (${excId}): ${newException.qtyAffected}x ${product ? product.name : sku}`;
      }
    }

    this.data.exceptions.unshift(newException);

    this.addNotification({
      type: 'critical',
      title: `New Exception Reported: ${excId}`,
      message: `${qtyAffected}x ${product ? product.name : sku} marked as ${reasonType}.`,
      actionUrl: 'exceptions',
      targetId: excId
    });

    this.logDecision({
      category: 'Exception Workflow Triggered',
      title: `Exception ${excId} opened for ${sku}`,
      whatHappened: `Marked ${qtyAffected} unit(s) as damaged/missing during picking in bin ${product ? product.binLocation : 'N/A'}.`,
      whyItHappened: `Reason: ${reasonType}. Decremented physical stock to preserve inventory accuracy.`,
      systemRecommendation: `Resolve affected order ${orderId} by split shipment or substituting ${product && product.substituteSKU ? product.substituteSKU : 'alternative item'}.`,
      status: 'Actionable'
    });

    this.saveState();
    this.emit('exception:created', newException);
    return newException;
  }

  resolveException(excId, resolutionAction) {
    const exc = this.data.exceptions.find(e => e.id === excId);
    if (!exc) return null;

    exc.status = 'Resolved';
    exc.actionTaken = resolutionAction;

    // Check if associated order can now proceed
    if (exc.orderId && exc.orderId !== 'N/A') {
      const order = this.getOrderById(exc.orderId);
      if (order && order.status === 'Exception') {
        order.status = 'Packing';
        order.allocationStatus = 'Resolution Applied';
      }
    }

    this.saveState();
    this.emit('exception:resolved', exc);
    return exc;
  }

  // System Decisions Log
  getDecisionsLog() {
    return this.data.decisionsLog || [];
  }

  logDecision(decision) {
    const dec = {
      id: `DEC-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Actionable',
      ...decision
    };
    this.data.decisionsLog.unshift(dec);
    this.saveState();
    this.emit('decision:logged', dec);
    return dec;
  }

  // Pickers & Workload
  getPickers() {
    return this.data.pickers || [];
  }

  assignPickerToOrder(orderId, pickerId) {
    const order = this.getOrderById(orderId);
    const picker = this.data.pickers.find(p => p.id === pickerId);
    if (!order || !picker) return null;

    order.assignedPicker = pickerId;
    if (order.status === 'Pending Allocation' || order.status === 'Allocated') {
      this.updateOrderStatus(orderId, 'Picking', `Assigned to ${picker.name} (${picker.zone})`);
    }

    picker.activeBatches += 1;
    this.saveState();
    this.emit('picker:assigned', { order, picker });
    return { order, picker };
  }

  // Notifications
  getNotifications() {
    return this.notifications;
  }

  addNotification(notif) {
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
      ...notif
    };
    this.notifications.unshift(newNotif);
    this.emit('notification:added', newNotif);
    return newNotif;
  }

  markNotificationRead(id) {
    const n = this.notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      this.emit('notification:read', id);
    }
  }

  markAllNotificationsRead() {
    this.notifications.forEach(n => n.read = true);
    this.emit('notifications:allRead');
  }

  // Preferences & Role
  setRole(role) {
    this.currentRole = role;
    localStorage.setItem('SW_ROLE', role);
    this.emit('role:changed', role);
  }

  setTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('SW_THEME', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.emit('theme:changed', theme);
  }

  // Computed Warehouse Summary Metrics
  getMetrics() {
    const orders = this.getOrders();
    const products = this.getProducts();
    const exceptions = this.getExceptions();

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => ['Pending Allocation', 'Allocated', 'Picking'].includes(o.status)).length;
    const dispatchReadyOrders = orders.filter(o => ['Packing', 'Quality Check'].includes(o.status)).length;
    const completedOrders = orders.filter(o => ['Dispatched', 'Delivered'].includes(o.status)).length;
    const openExceptions = exceptions.filter(e => e.status === 'Open').length;

    // Stock metrics
    const lowStockCount = products.filter(p => p.available > 0 && p.available <= p.reorderThreshold).length;
    const outOfStockCount = products.filter(p => p.available === 0).length;

    // Critical SLA risk orders (< 2 hrs remaining)
    const slaRiskOrders = orders.filter(o => {
      if (['Dispatched', 'Delivered'].includes(o.status)) return false;
      return o.priorityScore >= 85;
    }).length;

    return {
      totalOrders,
      pendingOrders,
      dispatchReadyOrders,
      completedOrders,
      openExceptions,
      lowStockCount,
      outOfStockCount,
      slaRiskOrders,
      bottleneckStage: 'Packing'
    };
  }
}

// Instantiate global state store
window.stateStore = new WarehouseStateStore();
