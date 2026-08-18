/**
 * SmartWarehouse AI - Initial Seed Data
 * Rich, realistic warehouse mock data covering SKUs, Bins, Orders, Pickers, Exceptions, and Baseline Metrics.
 */

const INITIAL_WAREHOUSE_DATA = {
  // Warehouse Zones & Bins
  bins: [
    { id: 'BIN-A1-01', zone: 'Zone A (Electronics)', aisle: 'A1', shelf: '01', capacity: 100, currentSKUs: ['SKU-ELEC-001', 'SKU-ELEC-002'] },
    { id: 'BIN-A1-02', zone: 'Zone A (Electronics)', aisle: 'A1', shelf: '02', capacity: 120, currentSKUs: ['SKU-ELEC-003'] },
    { id: 'BIN-A2-01', zone: 'Zone A (Electronics)', aisle: 'A2', shelf: '01', capacity: 80, currentSKUs: ['SKU-ELEC-004', 'SKU-ELEC-005'] },
    { id: 'BIN-A2-02', zone: 'Zone A (Electronics)', aisle: 'A2', shelf: '02', capacity: 150, currentSKUs: ['SKU-ELEC-006'] },
    { id: 'BIN-B1-01', zone: 'Zone B (Apparel)', aisle: 'B1', shelf: '01', capacity: 200, currentSKUs: ['SKU-APP-001', 'SKU-APP-002'] },
    { id: 'BIN-B1-02', zone: 'Zone B (Apparel)', aisle: 'B1', shelf: '02', capacity: 180, currentSKUs: ['SKU-APP-003'] },
    { id: 'BIN-B2-01', zone: 'Zone B (Apparel)', aisle: 'B2', shelf: '01', capacity: 150, currentSKUs: ['SKU-APP-004'] },
    { id: 'BIN-C1-01', zone: 'Zone C (Home Goods)', aisle: 'C1', shelf: '01', capacity: 90, currentSKUs: ['SKU-HOME-001', 'SKU-HOME-002'] },
    { id: 'BIN-C1-02', zone: 'Zone C (Home Goods)', aisle: 'C1', shelf: '02', capacity: 110, currentSKUs: ['SKU-HOME-003'] },
    { id: 'BIN-D1-01', zone: 'Zone D (Cold Storage)', aisle: 'D1', shelf: '01', capacity: 60, currentSKUs: ['SKU-COLD-001', 'SKU-COLD-002'] }
  ],

  // Products / Inventory Catalog
  products: [
    {
      sku: 'SKU-ELEC-001',
      name: 'Ultra-Fast Wireless Fast Charger 65W',
      category: 'Electronics',
      unitPrice: 49.99,
      quantity: 48,
      reserved: 32,
      available: 16,
      binLocation: 'BIN-A1-01',
      reorderThreshold: 25,
      reorderQtySuggestion: 60,
      dailyDemandVelocity: 8.5, // units/day
      leadTimeDays: 3,
      supplier: 'AnkerTech Logistics',
      dimensions: '12x8x4 cm',
      weightKg: 0.25,
      substituteSKU: 'SKU-ELEC-002',
      history: [
        { date: '2026-08-15 09:30', change: '+50', type: 'PO Receipt', user: 'System (PO-8821)' },
        { date: '2026-08-16 14:10', change: '-12', type: 'Order Allocation', user: 'Engine Auto-Alloc' },
        { date: '2026-08-17 11:00', change: '-20', type: 'Dispatched Wave 4', user: 'Picker Dave' }
      ]
    },
    {
      sku: 'SKU-ELEC-002',
      name: 'Pro MagSafe Dual Charging Pad 100W',
      category: 'Electronics',
      unitPrice: 89.99,
      quantity: 14,
      reserved: 12,
      available: 2,
      binLocation: 'BIN-A1-01',
      reorderThreshold: 20,
      reorderQtySuggestion: 45,
      dailyDemandVelocity: 5.2,
      leadTimeDays: 4,
      supplier: 'AnkerTech Logistics',
      dimensions: '15x10x5 cm',
      weightKg: 0.4,
      substituteSKU: 'SKU-ELEC-001',
      history: [
        { date: '2026-08-14 10:00', change: '+30', type: 'PO Receipt', user: 'System' },
        { date: '2026-08-17 16:45', change: '-16', type: 'Order Allocation', user: 'Engine Auto-Alloc' }
      ]
    },
    {
      sku: 'SKU-ELEC-003',
      name: 'Active Noise Cancelling Studio Headphones',
      category: 'Electronics',
      unitPrice: 199.99,
      quantity: 8,
      reserved: 8,
      available: 0,
      binLocation: 'BIN-A1-02',
      reorderThreshold: 15,
      reorderQtySuggestion: 40,
      dailyDemandVelocity: 6.0,
      leadTimeDays: 2,
      supplier: 'Acoustic Labs Inc.',
      dimensions: '22x18x10 cm',
      weightKg: 0.65,
      substituteSKU: null,
      history: [
        { date: '2026-08-16 08:20', change: '-15', type: 'Dispatched Wave 1', user: 'Picker Sarah' },
        { date: '2026-08-17 18:00', change: '0', type: 'Critical Stockout Alert', user: 'Stock Monitor' }
      ]
    },
    {
      sku: 'SKU-ELEC-004',
      name: 'Ergonomic Mechanical Keyboard (RGB)',
      category: 'Electronics',
      unitPrice: 129.99,
      quantity: 35,
      reserved: 10,
      available: 25,
      binLocation: 'BIN-A2-01',
      reorderThreshold: 15,
      reorderQtySuggestion: 30,
      dailyDemandVelocity: 3.8,
      leadTimeDays: 5,
      supplier: 'KeyCorp Dynamics',
      dimensions: '44x14x4 cm',
      weightKg: 1.1,
      substituteSKU: null,
      history: [
        { date: '2026-08-13 11:30', change: '+40', type: 'PO Receipt', user: 'Receiving Dock' }
      ]
    },
    {
      sku: 'SKU-ELEC-005',
      name: 'Precision Wireless Gaming Mouse 16k DPI',
      category: 'Electronics',
      unitPrice: 69.99,
      quantity: 5,
      reserved: 4,
      available: 1,
      binLocation: 'BIN-A2-01',
      reorderThreshold: 18,
      reorderQtySuggestion: 50,
      dailyDemandVelocity: 4.9,
      leadTimeDays: 3,
      supplier: 'KeyCorp Dynamics',
      dimensions: '12x7x4 cm',
      weightKg: 0.12,
      substituteSKU: null,
      history: [
        { date: '2026-08-16 15:30', change: '-10', type: 'Order Allocation', user: 'Engine Auto-Alloc' }
      ]
    },
    {
      sku: 'SKU-ELEC-006',
      name: 'Smart 4K Ultra HD Streaming Stick',
      category: 'Electronics',
      unitPrice: 39.99,
      quantity: 65,
      reserved: 20,
      available: 45,
      binLocation: 'BIN-A2-02',
      reorderThreshold: 20,
      reorderQtySuggestion: 50,
      dailyDemandVelocity: 7.2,
      leadTimeDays: 2,
      supplier: 'StreamTech Media',
      dimensions: '9x3x1.5 cm',
      weightKg: 0.08,
      substituteSKU: null,
      history: [
        { date: '2026-08-17 08:00', change: '+60', type: 'PO Receipt', user: 'Receiving Dock' }
      ]
    },
    {
      sku: 'SKU-APP-001',
      name: 'Merino Wool Thermal Crewneck - M',
      category: 'Apparel',
      unitPrice: 79.50,
      quantity: 82,
      reserved: 25,
      available: 57,
      binLocation: 'BIN-B1-01',
      reorderThreshold: 30,
      reorderQtySuggestion: 75,
      dailyDemandVelocity: 9.1,
      leadTimeDays: 4,
      supplier: 'Nordic Apparel Co.',
      dimensions: '30x25x3 cm',
      weightKg: 0.35,
      substituteSKU: 'SKU-APP-002',
      history: [
        { date: '2026-08-14 12:00', change: '+100', type: 'PO Receipt', user: 'Receiving Dock' }
      ]
    },
    {
      sku: 'SKU-APP-002',
      name: 'Merino Wool Thermal Crewneck - L',
      category: 'Apparel',
      unitPrice: 79.50,
      quantity: 18,
      reserved: 15,
      available: 3,
      binLocation: 'BIN-B1-01',
      reorderThreshold: 25,
      reorderQtySuggestion: 60,
      dailyDemandVelocity: 8.4,
      leadTimeDays: 4,
      supplier: 'Nordic Apparel Co.',
      dimensions: '32x27x3 cm',
      weightKg: 0.38,
      substituteSKU: 'SKU-APP-001',
      history: [
        { date: '2026-08-17 10:15', change: '-22', type: 'Order Allocation', user: 'Engine Auto-Alloc' }
      ]
    },
    {
      sku: 'SKU-APP-003',
      name: 'Waterproof All-Weather Trail Jacket - Black',
      category: 'Apparel',
      unitPrice: 149.00,
      quantity: 3,
      reserved: 3,
      available: 0,
      binLocation: 'BIN-B1-02',
      reorderThreshold: 12,
      reorderQtySuggestion: 35,
      dailyDemandVelocity: 4.2,
      leadTimeDays: 6,
      supplier: 'Apex Outerwear',
      dimensions: '35x30x6 cm',
      weightKg: 0.75,
      substituteSKU: null,
      history: [
        { date: '2026-08-16 11:45', change: '-8', type: 'Order Allocation', user: 'Engine Auto-Alloc' },
        { date: '2026-08-17 19:30', change: '0', type: 'Stock Depleted', user: 'System' }
      ]
    },
    {
      sku: 'SKU-APP-004',
      name: 'Seamless Performance Compression Tights',
      category: 'Apparel',
      unitPrice: 54.00,
      quantity: 45,
      reserved: 12,
      available: 33,
      binLocation: 'BIN-B2-01',
      reorderThreshold: 20,
      reorderQtySuggestion: 40,
      dailyDemandVelocity: 5.0,
      leadTimeDays: 3,
      supplier: 'Nordic Apparel Co.',
      dimensions: '25x20x2 cm',
      weightKg: 0.22,
      substituteSKU: null,
      history: [
        { date: '2026-08-15 14:00', change: '+50', type: 'PO Receipt', user: 'Receiving Dock' }
      ]
    },
    {
      sku: 'SKU-HOME-001',
      name: 'Smart Aroma Essential Oil Diffuser (WiFi)',
      category: 'Home Goods',
      unitPrice: 42.00,
      quantity: 52,
      reserved: 18,
      available: 34,
      binLocation: 'BIN-C1-01',
      reorderThreshold: 20,
      reorderQtySuggestion: 50,
      dailyDemandVelocity: 6.2,
      leadTimeDays: 5,
      supplier: 'Zenith Living',
      dimensions: '18x18x20 cm',
      weightKg: 0.85,
      substituteSKU: null,
      history: [
        { date: '2026-08-16 13:00', change: '-14', type: 'Order Allocation', user: 'Engine Auto-Alloc' }
      ]
    },
    {
      sku: 'SKU-HOME-002',
      name: 'Weighted Sleep Blanket 15lbs (Grey)',
      category: 'Home Goods',
      unitPrice: 85.00,
      quantity: 22,
      reserved: 16,
      available: 6,
      binLocation: 'BIN-C1-01',
      reorderThreshold: 15,
      reorderQtySuggestion: 30,
      dailyDemandVelocity: 3.5,
      leadTimeDays: 7,
      supplier: 'Zenith Living',
      dimensions: '40x35x15 cm',
      weightKg: 6.8,
      substituteSKU: null,
      history: [
        { date: '2026-08-14 16:30', change: '+25', type: 'PO Receipt', user: 'Receiving Dock' }
      ]
    },
    {
      sku: 'SKU-HOME-003',
      name: 'Double-Walled Insulated French Press 1L',
      category: 'Home Goods',
      unitPrice: 38.50,
      quantity: 31,
      reserved: 8,
      available: 23,
      binLocation: 'BIN-C1-02',
      reorderThreshold: 15,
      reorderQtySuggestion: 35,
      dailyDemandVelocity: 4.1,
      leadTimeDays: 4,
      supplier: 'Artisan Brew Craft',
      dimensions: '20x15x25 cm',
      weightKg: 1.1,
      substituteSKU: null,
      history: [
        { date: '2026-08-16 09:15', change: '-6', type: 'Order Allocation', user: 'Engine Auto-Alloc' }
      ]
    },
    {
      sku: 'SKU-COLD-001',
      name: 'Organic Probiotic Kombucha Starter Pack',
      category: 'Perishable',
      unitPrice: 28.00,
      quantity: 19,
      reserved: 14,
      available: 5,
      binLocation: 'BIN-D1-01',
      reorderThreshold: 15,
      reorderQtySuggestion: 40,
      dailyDemandVelocity: 6.8,
      leadTimeDays: 2,
      supplier: 'BioPure Organics',
      dimensions: '25x20x15 cm',
      weightKg: 2.5,
      substituteSKU: null,
      history: [
        { date: '2026-08-17 07:45', change: '+20', type: 'Fresh Batch Inbound', user: 'Cold Dock' }
      ]
    },
    {
      sku: 'SKU-COLD-002',
      name: 'Artisan Gourmet Truffle Butter 250g',
      category: 'Perishable',
      unitPrice: 34.00,
      quantity: 11,
      reserved: 8,
      available: 3,
      binLocation: 'BIN-D1-01',
      reorderThreshold: 10,
      reorderQtySuggestion: 25,
      dailyDemandVelocity: 3.2,
      leadTimeDays: 3,
      supplier: 'BioPure Organics',
      dimensions: '10x10x8 cm',
      weightKg: 0.3,
      substituteSKU: null,
      history: [
        { date: '2026-08-16 16:00', change: '-5', type: 'Order Allocation', user: 'Engine Auto-Alloc' }
      ]
    }
  ],

  // Warehouse Floor Workers / Pickers
  pickers: [
    { id: 'PICK-01', name: 'Marcus Vance', avatar: '👨‍💼', status: 'Active', zone: 'Zone A', activeBatches: 1, itemsPickedToday: 142, accuracyRate: 99.4, avgPickSpeedSec: 38 },
    { id: 'PICK-02', name: 'Elena Rostova', avatar: '👩‍💻', status: 'Active', zone: 'Zone B', activeBatches: 2, itemsPickedToday: 188, accuracyRate: 99.8, avgPickSpeedSec: 32 },
    { id: 'PICK-03', name: 'David Chen', avatar: '👨‍🔧', status: 'Active', zone: 'Zone C', activeBatches: 1, itemsPickedToday: 120, accuracyRate: 98.9, avgPickSpeedSec: 44 },
    { id: 'PICK-04', name: 'Aaliyah Patel', avatar: '👩‍🔬', status: 'Break', zone: 'Zone A & D', activeBatches: 0, itemsPickedToday: 95, accuracyRate: 100.0, avgPickSpeedSec: 35 },
    { id: 'PICK-05', name: 'Jordan Miller', avatar: '👨‍🚀', status: 'Active', zone: 'Zone D', activeBatches: 1, itemsPickedToday: 110, accuracyRate: 99.1, avgPickSpeedSec: 41 }
  ],

  // Customer Orders Dataset (various lifecycle stages and edge cases)
  orders: [
    {
      id: 'ORD-9011',
      customer: 'Apex Enterprise Global',
      customerTier: 'VIP Enterprise',
      orderDate: '2026-08-18 08:30',
      deadline: '2026-08-18 13:00', // 1.5 hrs remaining (SLA risk)
      status: 'Pending Allocation', // Created, Pending Allocation, Allocated, Picking, Packing, Quality Check, Dispatched, Delivered, Exception
      shippingAddress: '742 Evergreen Terrace, Seattle, WA',
      carrier: 'FedEx Priority Overnight',
      trackingNumber: null,
      assignedPicker: null,
      items: [
        { sku: 'SKU-ELEC-003', name: 'Active Noise Cancelling Studio Headphones', requestedQty: 10, allocatedQty: 8, fulfilled: false, binLocation: 'BIN-A1-02', unitPrice: 199.99 },
        { sku: 'SKU-ELEC-001', name: 'Ultra-Fast Wireless Fast Charger 65W', requestedQty: 15, allocatedQty: 15, fulfilled: true, binLocation: 'BIN-A1-01', unitPrice: 49.99 }
      ],
      totalValue: 2749.75,
      priorityScore: 98,
      priorityReason: '🚨 Critical SLA Breach Risk (<2 hrs) + VIP Enterprise Account + High Value ($2.7k)',
      manualOverride: false,
      overrideReason: null,
      allocationStatus: 'Partial Allocation',
      allocationDetails: {
        shortfallSku: 'SKU-ELEC-003',
        missingUnits: 2,
        reason: 'Requested 10 units of Studio Headphones, but total available was only 8. Allocated all 8 to this order due to #1 Priority rank. 2 units are short.',
        resolutionOptions: [
          { type: 'split_shipment', label: 'Split Ship Available (8 units now, 2 backordered)' },
          { type: 'substitute_sku', label: 'Offer Promo Upgrade / Alternative SKU' },
          { type: 'backorder', label: 'Hold full order until PO-8830 arrives' }
        ],
        chosenResolution: null
      },
      lifecycle: [
        { stage: 'Order Created', timestamp: '2026-08-18 08:30', completed: true, note: 'Order placed via EDI API' },
        { stage: 'Priority Computed', timestamp: '2026-08-18 08:31', completed: true, note: 'Auto-Priority assigned: Score 98 (VIP + Tight SLA)' },
        { stage: 'Stock Allocated', timestamp: '2026-08-18 08:32', completed: true, note: 'Partial stock allocated (8/10 Headphones, 15/15 Chargers)' },
        { stage: 'Picking', timestamp: null, completed: false, note: 'Awaiting wave assignment' },
        { stage: 'Packing', timestamp: null, completed: false, note: 'Pending' },
        { stage: 'Quality Check', timestamp: null, completed: false, note: 'Pending' },
        { stage: 'Dispatched', timestamp: null, completed: false, note: 'Pending' }
      ]
    },
    {
      id: 'ORD-9012',
      customer: 'TechCore Solutions Ltd.',
      customerTier: 'VIP Enterprise',
      orderDate: '2026-08-18 09:15',
      deadline: '2026-08-18 15:30',
      status: 'Picking',
      shippingAddress: '120 Innovation Way, Austin, TX',
      carrier: 'DHL Express',
      trackingNumber: null,
      assignedPicker: 'PICK-01',
      items: [
        { sku: 'SKU-ELEC-001', name: 'Ultra-Fast Wireless Fast Charger 65W', requestedQty: 10, allocatedQty: 10, fulfilled: true, binLocation: 'BIN-A1-01', unitPrice: 49.99 },
        { sku: 'SKU-ELEC-004', name: 'Ergonomic Mechanical Keyboard (RGB)', requestedQty: 4, allocatedQty: 4, fulfilled: true, binLocation: 'BIN-A2-01', unitPrice: 129.99 }
      ],
      totalValue: 1019.86,
      priorityScore: 88,
      priorityReason: '⭐ VIP Tier + High Value ($1,019) + SLA 4.5 hrs',
      manualOverride: false,
      overrideReason: null,
      allocationStatus: 'Fully Allocated',
      allocationDetails: {
        shortfallSku: null,
        missingUnits: 0,
        reason: '100% stock reserved from Bin A1-01 and A2-01.',
        resolutionOptions: []
      },
      lifecycle: [
        { stage: 'Order Created', timestamp: '2026-08-18 09:15', completed: true, note: 'Direct web order' },
        { stage: 'Priority Computed', timestamp: '2026-08-18 09:16', completed: true, note: 'Score 88' },
        { stage: 'Stock Allocated', timestamp: '2026-08-18 09:17', completed: true, note: 'All items locked' },
        { stage: 'Picking', timestamp: '2026-08-18 10:05', completed: true, inProgress: true, note: 'Picker Marcus Vance navigating Zone A' },
        { stage: 'Packing', timestamp: null, completed: false, note: 'Station 2 reserved' },
        { stage: 'Quality Check', timestamp: null, completed: false, note: 'Pending' },
        { stage: 'Dispatched', timestamp: null, completed: false, note: 'Pending' }
      ]
    },
    {
      id: 'ORD-9013',
      customer: 'Nordic Retailers Corp',
      customerTier: 'Regular Partner',
      orderDate: '2026-08-18 07:45',
      deadline: '2026-08-18 17:00',
      status: 'Packing',
      shippingAddress: '445 Fjords Way, Minneapolis, MN',
      carrier: 'UPS Ground',
      trackingNumber: null,
      assignedPicker: 'PICK-02',
      items: [
        { sku: 'SKU-APP-001', name: 'Merino Wool Thermal Crewneck - M', requestedQty: 15, allocatedQty: 15, fulfilled: true, binLocation: 'BIN-B1-01', unitPrice: 79.50 },
        { sku: 'SKU-APP-002', name: 'Merino Wool Thermal Crewneck - L', requestedQty: 8, allocatedQty: 8, fulfilled: true, binLocation: 'BIN-B1-01', unitPrice: 79.50 }
      ],
      totalValue: 1828.50,
      priorityScore: 76,
      priorityReason: '📦 High batch quantity + Standard SLA window',
      manualOverride: false,
      overrideReason: null,
      allocationStatus: 'Fully Allocated',
      allocationDetails: { shortfallSku: null, missingUnits: 0, reason: 'Full inventory confirmed.', resolutionOptions: [] },
      lifecycle: [
        { stage: 'Order Created', timestamp: '2026-08-18 07:45', completed: true, note: 'B2B Portal' },
        { stage: 'Priority Computed', timestamp: '2026-08-18 07:46', completed: true, note: 'Score 76' },
        { stage: 'Stock Allocated', timestamp: '2026-08-18 07:47', completed: true, note: 'Reserved in Bin B1-01' },
        { stage: 'Picking', timestamp: '2026-08-18 08:30', completed: true, note: 'Completed in 14 mins by Elena' },
        { stage: 'Packing', timestamp: '2026-08-18 09:20', completed: true, inProgress: true, note: 'Packing at Station 1' },
        { stage: 'Quality Check', timestamp: null, completed: false, note: 'Pending' },
        { stage: 'Dispatched', timestamp: null, completed: false, note: 'Pending' }
      ]
    },
    {
      id: 'ORD-9014',
      customer: 'FreshMart Grocery Network',
      customerTier: 'Regular Partner',
      orderDate: '2026-08-18 08:00',
      deadline: '2026-08-18 14:00',
      status: 'Quality Check',
      shippingAddress: '900 Cold Springs Blvd, Denver, CO',
      carrier: 'ColdChain Express',
      trackingNumber: null,
      assignedPicker: 'PICK-05',
      items: [
        { sku: 'SKU-COLD-001', name: 'Organic Probiotic Kombucha Starter Pack', requestedQty: 10, allocatedQty: 10, fulfilled: true, binLocation: 'BIN-D1-01', unitPrice: 28.00 },
        { sku: 'SKU-COLD-002', name: 'Artisan Gourmet Truffle Butter 250g', requestedQty: 5, allocatedQty: 5, fulfilled: true, binLocation: 'BIN-D1-01', unitPrice: 34.00 }
      ],
      totalValue: 450.00,
      priorityScore: 82,
      priorityReason: '❄️ Cold-chain perishable constraint + 3.5 hrs SLA window',
      manualOverride: false,
      overrideReason: null,
      allocationStatus: 'Fully Allocated',
      allocationDetails: { shortfallSku: null, missingUnits: 0, reason: 'Full inventory confirmed.', resolutionOptions: [] },
      lifecycle: [
        { stage: 'Order Created', timestamp: '2026-08-18 08:00', completed: true, note: 'Scheduled grocery order' },
        { stage: 'Priority Computed', timestamp: '2026-08-18 08:02', completed: true, note: 'Score 82' },
        { stage: 'Stock Allocated', timestamp: '2026-08-18 08:03', completed: true, note: 'Cold storage locked' },
        { stage: 'Picking', timestamp: '2026-08-18 08:45', completed: true, note: 'Completed by Jordan Miller' },
        { stage: 'Packing', timestamp: '2026-08-18 09:30', completed: true, note: 'Insulated dry-ice pack applied' },
        { stage: 'Quality Check', timestamp: '2026-08-18 10:10', completed: true, inProgress: true, note: 'Temp check passed, awaiting barcode scan' },
        { stage: 'Dispatched', timestamp: null, completed: false, note: 'Pending' }
      ]
    },
    {
      id: 'ORD-9015',
      customer: 'Comfort Home Interiors',
      customerTier: 'VIP Enterprise',
      orderDate: '2026-08-18 06:30',
      deadline: '2026-08-18 12:30',
      status: 'Dispatched',
      shippingAddress: '312 Elmwood Park, Chicago, IL',
      carrier: 'FedEx Ground',
      trackingNumber: 'FDX-8839210-USA',
      assignedPicker: 'PICK-03',
      items: [
        { sku: 'SKU-HOME-001', name: 'Smart Aroma Essential Oil Diffuser (WiFi)', requestedQty: 8, allocatedQty: 8, fulfilled: true, binLocation: 'BIN-C1-01', unitPrice: 42.00 },
        { sku: 'SKU-HOME-002', name: 'Weighted Sleep Blanket 15lbs (Grey)', requestedQty: 4, allocatedQty: 4, fulfilled: true, binLocation: 'BIN-C1-01', unitPrice: 85.00 }
      ],
      totalValue: 676.00,
      priorityScore: 91,
      priorityReason: '✅ Dispatched on time (Lead time 3h 15m)',
      manualOverride: false,
      overrideReason: null,
      allocationStatus: 'Fully Allocated',
      allocationDetails: { shortfallSku: null, missingUnits: 0, reason: 'Completed fulfillment cycle.', resolutionOptions: [] },
      lifecycle: [
        { stage: 'Order Created', timestamp: '2026-08-18 06:30', completed: true, note: 'Order synced' },
        { stage: 'Priority Computed', timestamp: '2026-08-18 06:31', completed: true, note: 'Score 91' },
        { stage: 'Stock Allocated', timestamp: '2026-08-18 06:32', completed: true, note: 'Stock locked' },
        { stage: 'Picking', timestamp: '2026-08-18 07:15', completed: true, note: 'Picked by David Chen' },
        { stage: 'Packing', timestamp: '2026-08-18 07:50', completed: true, note: 'Packed at Station 3' },
        { stage: 'Quality Check', timestamp: '2026-08-18 08:20', completed: true, note: 'QC Passed by Inspector 4' },
        { stage: 'Dispatched', timestamp: '2026-08-18 09:45', completed: true, note: 'Scanned into FedEx Truck #8' }
      ]
    },
    {
      id: 'ORD-9016',
      customer: 'Skyline Gaming Lounge',
      customerTier: 'Standard',
      orderDate: '2026-08-18 09:40',
      deadline: '2026-08-18 19:00',
      status: 'Pending Allocation',
      shippingAddress: '55 Pier Street, San Francisco, CA',
      carrier: 'UPS 2-Day',
      trackingNumber: null,
      assignedPicker: null,
      items: [
        { sku: 'SKU-ELEC-003', name: 'Active Noise Cancelling Studio Headphones', requestedQty: 4, allocatedQty: 0, fulfilled: false, binLocation: 'BIN-A1-02', unitPrice: 199.99 },
        { sku: 'SKU-ELEC-005', name: 'Precision Wireless Gaming Mouse 16k DPI', requestedQty: 4, allocatedQty: 4, fulfilled: true, binLocation: 'BIN-A2-01', unitPrice: 69.99 }
      ],
      totalValue: 1079.92,
      priorityScore: 54,
      priorityReason: '⚠️ Lower priority rank (Standard tier, 9h SLA window). Stockout on Headphones due to higher-priority allocation to ORD-9011.',
      manualOverride: false,
      overrideReason: null,
      allocationStatus: 'Stock Conflict (Delayed)',
      allocationDetails: {
        shortfallSku: 'SKU-ELEC-003',
        missingUnits: 4,
        reason: 'SKU-ELEC-003 was completely claimed by higher priority VIP order ORD-9011 (Score 98 vs 54). Zero remaining units in Bin A1-02.',
        resolutionOptions: [
          { type: 'backorder', label: 'Queue for arrival of Inbound PO-8830 (ETA: Tomorrow 10am)' },
          { type: 'split_shipment', label: 'Dispatch Gaming Mice immediately, hold Headphones' },
          { type: 'notify_delay', label: 'Send automated SLA adjustment notice to customer' }
        ],
        chosenResolution: null
      },
      lifecycle: [
        { stage: 'Order Created', timestamp: '2026-08-18 09:40', completed: true, note: 'Standard online order' },
        { stage: 'Priority Computed', timestamp: '2026-08-18 09:41', completed: true, note: 'Score 54' },
        { stage: 'Stock Allocated', timestamp: '2026-08-18 09:42', completed: false, note: 'Stock conflict detected on SKU-ELEC-003' },
        { stage: 'Picking', timestamp: null, completed: false, note: 'Pending stock resolution' },
        { stage: 'Packing', timestamp: null, completed: false, note: 'Pending' },
        { stage: 'Quality Check', timestamp: null, completed: false, note: 'Pending' },
        { stage: 'Dispatched', timestamp: null, completed: false, note: 'Pending' }
      ]
    },
    {
      id: 'ORD-9017',
      customer: 'Alpine Outfitters Boutique',
      customerTier: 'Regular Partner',
      orderDate: '2026-08-18 09:00',
      deadline: '2026-08-18 16:00',
      status: 'Exception',
      shippingAddress: '108 Mountain Ridge, Aspen, CO',
      carrier: 'FedEx Express',
      trackingNumber: null,
      assignedPicker: 'PICK-02',
      items: [
        { sku: 'SKU-APP-003', name: 'Waterproof All-Weather Trail Jacket - Black', requestedQty: 3, allocatedQty: 3, fulfilled: false, binLocation: 'BIN-B1-02', unitPrice: 149.00 }
      ],
      totalValue: 447.00,
      priorityScore: 72,
      priorityReason: '🚨 Exception Flagged: 1 unit damaged during picking; order stalled.',
      manualOverride: false,
      overrideReason: null,
      allocationStatus: 'Exception - Damaged Item',
      allocationDetails: {
        shortfallSku: 'SKU-APP-003',
        missingUnits: 1,
        reason: 'During picking in Bin B1-02, 1 jacket had a torn seam. Remaining physical stock is 2 healthy units (need 3). Total inventory is now depleted.',
        resolutionOptions: [
          { type: 'substitute_sku', label: 'Substitute with SKU-APP-001 (Thermal Crewneck combo) + 15% discount' },
          { type: 'split_shipment', label: 'Ship 2 healthy units, refund 1 unit' },
          { type: 'manager_override', label: 'Escalate to Warehouse Manager for expedited cross-dock' }
        ],
        chosenResolution: null
      },
      lifecycle: [
        { stage: 'Order Created', timestamp: '2026-08-18 09:00', completed: true, note: 'Retail portal order' },
        { stage: 'Priority Computed', timestamp: '2026-08-18 09:01', completed: true, note: 'Score 72' },
        { stage: 'Stock Allocated', timestamp: '2026-08-18 09:02', completed: true, note: 'Allocated 3 units' },
        { stage: 'Picking', timestamp: '2026-08-18 09:40', completed: false, inProgress: false, note: 'Exception raised by Elena: Damaged seam in Bin B1-02' },
        { stage: 'Packing', timestamp: null, completed: false, note: 'Halted' },
        { stage: 'Quality Check', timestamp: null, completed: false, note: 'Halted' },
        { stage: 'Dispatched', timestamp: null, completed: false, note: 'Halted' }
      ]
    }
  ],

  // Exceptions & Damaged Item Log
  exceptions: [
    {
      id: 'EXC-4091',
      orderId: 'ORD-9017',
      sku: 'SKU-APP-003',
      productName: 'Waterproof All-Weather Trail Jacket - Black',
      binLocation: 'BIN-B1-02',
      qtyAffected: 1,
      reportedBy: 'Elena Rostova (PICK-02)',
      reportedAt: '2026-08-18 09:42',
      reasonType: 'Damaged in Bin (Torn Seam)',
      severity: 'High',
      status: 'Open', // Open, Resolved, Escalated
      systemRecommendation: 'Immediately decrement stock by 1, notify inventory controller, and offer customer split shipment or alternative SKU.',
      actionTaken: null
    },
    {
      id: 'EXC-4089',
      orderId: 'ORD-8994',
      sku: 'SKU-HOME-001',
      productName: 'Smart Aroma Essential Oil Diffuser (WiFi)',
      binLocation: 'BIN-C1-01',
      qtyAffected: 2,
      reportedBy: 'David Chen (PICK-03)',
      reportedAt: '2026-08-17 14:20',
      reasonType: 'Crushed Packaging during Forklift Transit',
      severity: 'Medium',
      status: 'Resolved',
      systemRecommendation: 'Stock quarantined for vendor return. Re-allocated 2 replacement units from reserve shelf C1-02.',
      actionTaken: 'Replaced with reserve stock; order ORD-8994 fulfilled on time.'
    }
  ],

  // System Decision Log (Plain English Explainability Engine Trail)
  decisionsLog: [
    {
      id: 'DEC-1049',
      timestamp: '2026-08-18 09:42',
      category: 'Stock Allocation',
      title: 'Shortage Allocation on Studio Headphones (SKU-ELEC-003)',
      whatHappened: 'Allocated all 8 available units to VIP Order ORD-9011 and delayed Standard Order ORD-9016.',
      whyItHappened: 'ORD-9011 has Priority Score 98 (SLA deadline in 1.5h, VIP Enterprise account with $50k annual spend). ORD-9016 has Priority Score 54 (SLA in 9h, Standard tier).',
      systemRecommendation: 'Trigger PO-8830 expedited receiving and offer ORD-9016 split dispatch of Gaming Mice.',
      status: 'Actionable'
    },
    {
      id: 'DEC-1048',
      timestamp: '2026-08-18 09:15',
      category: 'Smart Reorder',
      title: 'Automated Velocity PO Trigger for Wireless Charger (SKU-ELEC-001)',
      whatHappened: 'Calculated 1.8 Days of Inventory remaining at current velocity (8.5 units/day).',
      whyItHappened: 'Stock dropped to 16 available units, crossing below the safety threshold of 25 units with a 3-day supplier lead time.',
      systemRecommendation: 'Submit Purchase Order for 60 units to AnkerTech Logistics before 12:00 PM cutoff to prevent tomorrow stockout.',
      status: 'Actionable'
    },
    {
      id: 'DEC-1047',
      timestamp: '2026-08-18 08:35',
      category: 'Route Optimization',
      title: 'Wave 2 Pick Path Clustered in Zone A & B',
      whatHappened: 'Grouped 5 orders into a single batch pick path traversing Bin A1-01 -> A2-01 -> B1-01.',
      whyItHappened: 'Reduces total floor travel distance by 42% (saving 680 meters of walking) compared to single-order picking.',
      systemRecommendation: 'Assign Batch Wave 2 to Marcus Vance (Zone A specialist).',
      status: 'Completed'
    },
    {
      id: 'DEC-1046',
      timestamp: '2026-08-18 08:10',
      category: 'Bottleneck Detection',
      title: 'Packing Station Dwell Time Spike Detected',
      whatHappened: 'Average packing time rose to 18.4 mins/order (historical baseline is 5.2 mins).',
      whyItHappened: 'Station 2 ran out of custom 40x35x15 cardboard shipping boxes; 3 large orders queued simultaneously.',
      systemRecommendation: 'Rebalance 2 packing specialists from Station 1 to Station 2 and replenish corrugated box cart.',
      status: 'Actionable'
    }
  ],

  // Stage Time Analytics & Historical Benchmarks (in minutes)
  stageMetrics: {
    'Order Created': { avgMinutes: 1.2, benchmarkMinutes: 2.0, status: 'Optimal' },
    'Priority Engine': { avgMinutes: 0.4, benchmarkMinutes: 0.5, status: 'Optimal' },
    'Stock Allocation': { avgMinutes: 1.8, benchmarkMinutes: 3.0, status: 'Optimal' },
    'Picking': { avgMinutes: 14.5, benchmarkMinutes: 15.0, status: 'Good' },
    'Packing': { avgMinutes: 19.8, benchmarkMinutes: 6.0, status: 'Bottleneck' }, // Active Congestion
    'Quality Check': { avgMinutes: 4.2, benchmarkMinutes: 5.0, status: 'Good' },
    'Dispatch': { avgMinutes: 8.5, benchmarkMinutes: 10.0, status: 'Good' }
  }
};
