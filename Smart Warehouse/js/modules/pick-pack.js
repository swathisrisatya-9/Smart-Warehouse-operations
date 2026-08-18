/**
 * SmartWarehouse AI - Picking & Packing Management Module
 * Implements route-optimized pick lists, floor worker assignments, and packing verification checklists.
 */

const PickPackModule = {
  activeBatchWave: null,
  activePackingOrderId: 'ORD-9013',

  init() {
    this.generateWaveRoute();
    this.render();
    window.stateStore.on('state:change', () => this.render());
    window.stateStore.on('picker:assigned', () => this.render());
  },

  generateWaveRoute() {
    const store = window.stateStore;
    const pickingOrders = store.getOrders().filter(o => ['Allocated', 'Picking'].includes(o.status));

    // Aggregate line items
    const routeNodes = [];
    pickingOrders.forEach(o => {
      o.items.forEach(i => {
        if (i.allocatedQty > 0) {
          routeNodes.push({
            orderId: o.id,
            sku: i.sku,
            name: i.name,
            bin: i.binLocation || 'BIN-A1-01',
            qty: i.allocatedQty
          });
        }
      });
    });

    // Sort by Bin Location alphanumeric sequence (Route Optimization)
    routeNodes.sort((a, b) => a.bin.localeCompare(b.bin));

    this.activeBatchWave = {
      waveId: 'WAVE-BCH-04',
      ordersCount: pickingOrders.length,
      totalUnits: routeNodes.reduce((s, n) => s + n.qty, 0),
      nodes: routeNodes,
      distanceSavedMeters: 480,
      estimatedMinutes: 18
    };
  },

  render() {
    this.renderRouteVisualizer();
    this.renderPickersList();
    this.renderPackingStation();
  },

  renderRouteVisualizer() {
    const container = document.getElementById('pick-route-steps');
    if (!container) return;

    if (!this.activeBatchWave || this.activeBatchWave.nodes.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.82rem;">No active picking waves queued.</div>`;
      return;
    }

    container.innerHTML = this.activeBatchWave.nodes.map((n, idx) => `
      <div class="route-node">
        <div class="route-node-seq">${idx + 1}</div>
        <div class="route-node-info">
          <div class="route-node-bin">${n.bin}</div>
          <div class="route-node-sku">${n.qty}x ${n.sku}</div>
        </div>
      </div>
      ${idx < this.activeBatchWave.nodes.length - 1 ? '<div class="route-arrow">➔</div>' : ''}
    `).join('');
  },

  renderPickersList() {
    const container = document.getElementById('pickers-assignment-list');
    if (!container) return;

    const store = window.stateStore;
    const pickers = store.getPickers();

    container.innerHTML = pickers.map(p => `
      <div class="leaderboard-row">
        <div class="leader-info">
          <span class="leader-avatar">${p.avatar}</span>
          <div>
            <div class="leader-name">${p.name}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${p.zone} • ${p.activeBatches} active batch(es)</div>
          </div>
        </div>
        <div class="leader-stats">
          <div><strong style="color: var(--status-success);">${p.accuracyRate}%</strong> acc</div>
          <div><strong>${p.avgPickSpeedSec}s</strong>/item</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="PickPackModule.assignWorkload('${p.id}')">
          Assign Next Wave
        </button>
      </div>
    `).join('');
  },

  renderPackingStation() {
    const container = document.getElementById('packing-station-container');
    if (!container) return;

    const store = window.stateStore;
    const order = store.getOrderById(this.activePackingOrderId) || store.getOrders().find(o => o.status === 'Packing');

    if (!order) {
      container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No orders currently queued at Packing Station 1.</div>`;
      return;
    }

    this.activePackingOrderId = order.id;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <div>
          <div style="font-weight: 700; font-size: 1rem;">Packing Order: ${order.id}</div>
          <div style="font-size: 0.76rem; color: var(--text-muted);">${order.customer} • ${order.customerTier}</div>
        </div>
        <span class="badge badge-warning">Station 1: In Progress</span>
      </div>

      <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--text-secondary);">
        Item Verification Checklist (Scan or Verify Each SKU):
      </div>

      <div class="packing-checklist">
        ${order.items.map((item, idx) => `
          <div class="checklist-item ${item.verified ? 'verified' : ''}" id="pack-item-${idx}">
            <div class="checklist-left">
              <div class="custom-checkbox ${item.verified ? 'checked' : ''}" onclick="PickPackModule.toggleVerifyItem('${order.id}', ${idx})">
                ${item.verified ? '✓' : ''}
              </div>
              <div>
                <div style="font-weight: 600; font-size: 0.84rem;">${item.name}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">SKU: ${item.sku} • Bin: ${item.binLocation || 'A1-01'}</div>
              </div>
            </div>
            <div style="font-size: 0.85rem; font-weight: 700;">
              ${item.allocatedQty} unit(s)
            </div>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem;">
        <button class="btn btn-secondary btn-sm" onclick="PickPackModule.reportDamagedInPack('${order.id}')">
          🚨 Report Damaged Item
        </button>
        <button class="btn btn-success btn-sm" onclick="PickPackModule.completePacking('${order.id}')">
          ✓ Seal Carton & Send to QC
        </button>
      </div>
    `;
  },

  toggleVerifyItem(orderId, itemIndex) {
    const store = window.stateStore;
    const order = store.getOrderById(orderId);
    if (!order || !order.items[itemIndex]) return;

    order.items[itemIndex].verified = !order.items[itemIndex].verified;
    store.saveState();
    this.renderPackingStation();
  },

  completePacking(orderId) {
    const store = window.stateStore;
    const order = store.getOrderById(orderId);
    if (!order) return;

    // Mark all verified
    order.items.forEach(i => i.verified = true);
    store.updateOrderStatus(orderId, 'Quality Check', 'Packed at Station 1 and transferred to QC scanning table');

    store.addNotification({
      type: 'success',
      title: 'Order Packed Successfully',
      message: `${orderId} sealed and transferred to Quality Check table.`,
      actionUrl: 'qc-dispatch',
      targetId: orderId
    });

    // Pick next packing order
    const nextPacking = store.getOrders().find(o => o.status === 'Packing' && o.id !== orderId);
    if (nextPacking) {
      this.activePackingOrderId = nextPacking.id;
    }
    this.render();
  },

  reportDamagedInPack(orderId) {
    window.ExceptionsModule.openReportModal(orderId);
  },

  assignWorkload(pickerId) {
    const store = window.stateStore;
    const pending = store.getOrders().find(o => o.status === 'Pending Allocation' || o.status === 'Allocated');
    if (pending) {
      store.assignPickerToOrder(pending.id, pickerId);
    } else {
      alert('No unassigned orders currently awaiting picking.');
    }
  }
};

window.PickPackModule = PickPackModule;
