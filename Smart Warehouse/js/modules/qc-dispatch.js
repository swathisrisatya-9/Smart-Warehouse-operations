/**
 * SmartWarehouse AI - Quality Check & Dispatch Tracking Module
 * Manages QC inspections, carrier tracking generation, and the final dispatch milestone.
 */

const QCDispatchModule = {
  activeQCIndex: 0,

  init() {
    this.render();
    window.stateStore.on('state:change', () => this.render());
    window.stateStore.on('order:statusChanged', () => this.render());
  },

  render() {
    this.renderQCTable();
    this.renderDispatchQueue();
  },

  renderQCTable() {
    const container = document.getElementById('qc-inspection-card');
    if (!container) return;

    const store = window.stateStore;
    const qcOrders = store.getOrders().filter(o => o.status === 'Quality Check');

    if (qcOrders.length === 0) {
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
          ✨ No packages waiting for Quality Inspection at Station 4.
        </div>`;
      return;
    }

    const order = qcOrders[0];

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
          <strong style="font-size: 1.1rem; color: var(--text-primary);">Inspection: ${order.id}</strong>
          <div style="font-size: 0.76rem; color: var(--text-muted);">${order.customer} • Priority Score: ${order.priorityScore}</div>
        </div>
        <span class="badge badge-info">QC Station 4 Active</span>
      </div>

      <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
        <div style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.5rem;">Carton Content Verification</div>
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          ${order.items.map(i => `
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
              <span>✓ ${i.allocatedQty}x ${i.name}</span>
              <span style="font-family: monospace; color: var(--accent-cyan);">${i.sku}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem;">
        <label style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; cursor: pointer;">
          <input type="checkbox" id="qc-check-weight" checked style="accent-color: var(--status-success);">
          Carton tare weight within ±2% tolerance (${(order.items.reduce((s, i) => s + (i.allocatedQty * 0.4), 0.5)).toFixed(2)} kg)
        </label>
        <label style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; cursor: pointer;">
          <input type="checkbox" id="qc-check-seal" checked style="accent-color: var(--status-success);">
          Tamper-evident security tape intact and packaging undamaged
        </label>
        <label style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; cursor: pointer;">
          <input type="checkbox" id="qc-check-label" checked style="accent-color: var(--status-success);">
          Destination barcode label scannable: "${order.shippingAddress}"
        </label>
      </div>

      <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button class="btn btn-danger btn-sm" onclick="QCDispatchModule.failQC('${order.id}')">
          ❌ Fail QC (Return to Packing)
        </button>
        <button class="btn btn-success btn-sm" onclick="QCDispatchModule.passQC('${order.id}')">
          ✓ Pass QC & Move to Dispatch
        </button>
      </div>
    `;
  },

  renderDispatchQueue() {
    const tbody = document.getElementById('dispatch-table-body');
    if (!tbody) return;

    const store = window.stateStore;
    const dispatched = store.getOrders().filter(o => ['Dispatched', 'Delivered'].includes(o.status));

    if (dispatched.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No dispatched orders yet today.</td></tr>`;
      return;
    }

    tbody.innerHTML = dispatched.map(o => `
      <tr>
        <td>
          <strong style="font-family: monospace; color: var(--accent-primary);">${o.id}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${o.orderDate}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${o.customer}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${o.shippingAddress}</div>
        </td>
        <td>
          <span class="badge badge-neutral">${o.carrier || 'FedEx Ground'}</span>
        </td>
        <td>
          <strong style="font-family: monospace; color: var(--status-success); font-size: 0.82rem;">
            ${o.trackingNumber || 'TRK-GEN-883019'}
          </strong>
        </td>
        <td>
          <span class="badge badge-success">✓ Dispatched</span>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="QCDispatchModule.openShippingLabel('${o.id}')">
            🖨️ Label
          </button>
        </td>
      </tr>
    `).join('');
  },

  passQC(orderId) {
    const store = window.stateStore;
    const order = store.getOrderById(orderId);
    if (!order) return;

    const carrierList = ['FedEx Priority Overnight', 'DHL Express', 'UPS Air', 'Speedy Freight'];
    const assignedCarrier = order.carrier || carrierList[Math.floor(Math.random() * carrierList.length)];
    const generatedTracking = `TRK-${assignedCarrier.substring(0, 3).toUpperCase()}-${Math.floor(1000000 + Math.random() * 9000000)}`;

    order.carrier = assignedCarrier;
    order.trackingNumber = generatedTracking;

    store.updateOrderStatus(orderId, 'Dispatched', `QC Passed by Inspector 4. Scanned into carrier trailer with tracking ${generatedTracking}`);

    store.logDecision({
      category: 'Dispatch Execution',
      title: `Order ${orderId} released for dispatch`,
      whatHappened: `Generated shipping barcode ${generatedTracking} for ${assignedCarrier}.`,
      whyItHappened: `Completed QC item verification and tamper inspection without defects.`,
      systemRecommendation: 'Notify customer carrier tracking portal via automated webhook.',
      status: 'Completed'
    });

    store.addNotification({
      type: 'success',
      title: 'Order Dispatched',
      message: `${orderId} dispatched via ${assignedCarrier} (${generatedTracking}).`,
      actionUrl: 'qc-dispatch',
      targetId: orderId
    });

    this.render();
  },

  failQC(orderId) {
    const store = window.stateStore;
    store.updateOrderStatus(orderId, 'Packing', 'QC Failed: Packaging irregularity detected. Returned to Packing Station 1');
    this.render();
  },

  openShippingLabel(orderId) {
    const store = window.stateStore;
    const order = store.getOrderById(orderId);
    if (!order) return;

    const modal = document.getElementById('modal-shipping-label');
    const container = document.getElementById('shipping-label-container');

    if (container) {
      container.innerHTML = `
        <div class="shipping-label-card">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
            <div style="font-weight: 900; font-size: 1.2rem;">${order.carrier || 'FEDEX EXPRESS'}</div>
            <div style="font-size: 0.8rem; font-weight: 700;">PRIORITY OVERNIGHT</div>
          </div>
          <div style="font-size: 0.75rem; margin-bottom: 0.75rem;">
            <strong>SHIP FROM:</strong><br>
            SmartWarehouse Fulfillment Hub #4<br>
            Dock Door 12, Seattle Distribution Center
          </div>
          <div style="font-size: 0.85rem; margin-bottom: 0.75rem; border: 1px solid #000; padding: 0.5rem;">
            <strong>SHIP TO:</strong><br>
            <strong>${order.customer}</strong><br>
            ${order.shippingAddress}<br>
            UNITED STATES
          </div>
          <div class="label-barcode-mock"></div>
          <div style="text-align: center; font-weight: 700; font-size: 0.88rem; letter-spacing: 0.05em;">
            ${order.trackingNumber || 'TRK-FDX-8839210-USA'}
          </div>
        </div>
      `;
    }

    if (modal) modal.classList.add('active');
  }
};

window.QCDispatchModule = QCDispatchModule;
