/**
 * SmartWarehouse AI - Interactive Demo Scenarios for Judges & Reviewers
 * Provides 1-click test scenarios to showcase decision engine edge cases and explainability.
 */

const DemoScenarios = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    const select = document.getElementById('demo-scenario-select');
    if (select) {
      select.addEventListener('change', (e) => {
        const scenario = e.target.value;
        if (scenario) {
          this.executeScenario(scenario);
          select.value = ''; // Reset selector
        }
      });
    }
  },

  executeScenario(scenarioKey) {
    const store = window.stateStore;

    switch (scenarioKey) {
      case 'surge':
        this.runBlackFridaySurge();
        break;
      case 'stockout':
        this.runCriticalStockout();
        break;
      case 'damage':
        this.runDamageException();
        break;
      case 'bottleneck':
        this.runBottleneckSpike();
        break;
      case 'reset':
        this.resetAll();
        break;
      default:
        console.log('Unknown scenario:', scenarioKey);
    }
  },

  runBlackFridaySurge() {
    const store = window.stateStore;
    const surgeOrders = [
      {
        id: `ORD-SURGE-${Math.floor(100 + Math.random() * 900)}`,
        customer: 'OmniCorp Global Retail',
        customerTier: 'VIP Enterprise',
        orderDate: '2026-08-18 11:15',
        deadline: '2026-08-18 12:45', // 1.25 hrs (Severe SLA risk)
        status: 'Pending Allocation',
        shippingAddress: '100 Wall Street, New York, NY',
        carrier: 'FedEx Priority Overnight',
        totalValue: 3450.00,
        priorityScore: 99,
        priorityReason: '🚨 Black Friday Flash VIP Order (<1.5h SLA Deadline)',
        items: [
          { sku: 'SKU-ELEC-001', name: 'Ultra-Fast Wireless Fast Charger 65W', requestedQty: 20, allocatedQty: 0, fulfilled: false, binLocation: 'BIN-A1-01', unitPrice: 49.99 },
          { sku: 'SKU-ELEC-004', name: 'Ergonomic Mechanical Keyboard (RGB)', requestedQty: 10, allocatedQty: 0, fulfilled: false, binLocation: 'BIN-A2-01', unitPrice: 129.99 }
        ],
        lifecycle: [
          { stage: 'Order Created', timestamp: '2026-08-18 11:15', completed: true, note: 'EDI Flash Influx' },
          { stage: 'Priority Computed', timestamp: '2026-08-18 11:16', completed: true, note: 'Auto-Scored: 99' },
          { stage: 'Stock Allocated', timestamp: null, completed: false, note: 'Pending' },
          { stage: 'Picking', timestamp: null, completed: false, note: 'Pending' },
          { stage: 'Packing', timestamp: null, completed: false, note: 'Pending' },
          { stage: 'Quality Check', timestamp: null, completed: false, note: 'Pending' },
          { stage: 'Dispatched', timestamp: null, completed: false, note: 'Pending' }
        ]
      }
    ];

    store.data.orders.unshift(...surgeOrders);
    store.saveState();

    store.logDecision({
      category: 'Surge Influx Detected',
      title: 'High-Value VIP Order Injected (ORD-SURGE)',
      whatHappened: 'OmniCorp placed a $3,450 urgent order with a 1.25h deadline.',
      whyItHappened: 'Priority Engine assigned Top Score (99) due to VIP SLA contract rules.',
      systemRecommendation: 'Immediately prioritize Allocation Engine and reserve Bin A1-01 stock.',
      status: 'Actionable'
    });

    store.addNotification({
      type: 'critical',
      title: '🚨 Flash Sale Surge Influx',
      message: 'New VIP Enterprise Order injected with 1.25h deadline! Priority Engine recalculated rankings.',
      actionUrl: 'orders'
    });

    window.appRouter.navigateTo('orders');
  },

  runCriticalStockout() {
    const store = window.stateStore;
    // Set Studio Headphones to 0 stock
    const p = store.getProductBySku('SKU-ELEC-003');
    if (p) {
      p.quantity = 0;
      p.available = 0;
      p.reserved = 0;
    }
    store.saveState();

    store.logDecision({
      category: 'Scarcity Conflict',
      title: 'Zero Stock Outage on Studio Headphones',
      whatHappened: 'Available inventory dropped to 0 across all bins.',
      whyItHappened: 'Supplier shipment delayed; pending orders blocked.',
      systemRecommendation: 'Allocation Engine recommending split shipments and PO replenishment.',
      status: 'Actionable'
    });

    store.addNotification({
      type: 'critical',
      title: 'Stockout Scenario Active',
      message: 'SKU-ELEC-003 is out of stock. Allocation engine matrix updated with conflict resolutions.',
      actionUrl: 'allocation'
    });

    window.appRouter.navigateTo('allocation');
  },

  runDamageException() {
    const store = window.stateStore;
    store.reportException({
      orderId: 'ORD-9012',
      sku: 'SKU-ELEC-004',
      qtyAffected: 1,
      reasonType: 'Crushed Frame (Forklift Collision)',
      severity: 'Critical',
      reportedBy: 'Marcus Vance (PICK-01)',
      notes: 'Damaged item removed from Bin A2-01.'
    });

    window.appRouter.navigateTo('exceptions');
  },

  runBottleneckSpike() {
    const store = window.stateStore;
    store.logDecision({
      category: 'Bottleneck Alert',
      title: 'Packing Station Dwell Time Spike (24.5 min)',
      whatHappened: 'Packing cycle time spiked to 4.1x historical baseline.',
      whyItHappened: 'Station 2 run out of corrugated packaging cartons.',
      systemRecommendation: 'Reassign 2 floor workers to packing station immediately.',
      status: 'Actionable'
    });

    store.addNotification({
      type: 'warning',
      title: 'Severe Packing Bottleneck',
      message: 'Packing dwell time spiked to 24.5 min. Operational analytics diagnostics triggered.',
      actionUrl: 'analytics'
    });

    window.appRouter.navigateTo('analytics');
  },

  resetAll() {
    window.stateStore.resetToDefault();
    window.location.reload();
  }
};

window.DemoScenarios = DemoScenarios;
