/**
 * SmartWarehouse AI - Order Management & Prioritization Module
 * Displays order queues, multi-factor priority scores, SLA risk meters, and manual overrides.
 */

const OrdersModule = {
  statusFilter: 'all',
  searchQuery: '',
  selectedOrderId: null,

  init() {
    this.bindEvents();
    this.render();
    window.stateStore.on('state:change', () => this.render());
    window.stateStore.on('order:statusChanged', () => this.render());
    window.stateStore.on('order:priorityOverridden', () => this.render());
  },

  bindEvents() {
    const searchInput = document.getElementById('orders-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.render();
      });
    }

    const statusSelect = document.getElementById('orders-status-filter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.render();
      });
    }
  },

  render() {
    const store = window.stateStore;
    const orders = store.getOrders();
    const products = store.getProducts();

    // Recompute priorities on the fly if needed
    orders.forEach(o => {
      if (!o.manualOverride) {
        const computed = PriorityEngine.computePriority(o, products);
        o.priorityScore = computed.score;
        o.priorityReason = computed.reason;
      }
    });

    const filtered = orders.filter(o => {
      const matchesSearch = !this.searchQuery ||
        o.id.toLowerCase().includes(this.searchQuery) ||
        o.customer.toLowerCase().includes(this.searchQuery) ||
        o.items.some(i => i.name.toLowerCase().includes(this.searchQuery) || i.sku.toLowerCase().includes(this.searchQuery));

      let matchesStatus = true;
      if (this.statusFilter !== 'all') {
        matchesStatus = o.status.toLowerCase().includes(this.statusFilter.toLowerCase());
      }

      return matchesSearch && matchesStatus;
    });

    // Sort by priority score descending
    filtered.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    this.renderTable(filtered);
  },

  renderTable(orders) {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-muted);">No orders match your filter criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => {
      // Score styling
      let scoreClass = 'score-low';
      if (o.priorityScore >= 90) scoreClass = 'score-critical';
      else if (o.priorityScore >= 75) scoreClass = 'score-high';
      else if (o.priorityScore >= 50) scoreClass = 'score-medium';

      // Status badge
      let statusBadge = '<span class="badge badge-info">' + o.status + '</span>';
      if (o.status === 'Dispatched' || o.status === 'Delivered') {
        statusBadge = '<span class="badge badge-success">✓ ' + o.status + '</span>';
      } else if (o.status === 'Exception') {
        statusBadge = '<span class="badge badge-critical">🚨 ' + o.status + '</span>';
      } else if (o.status === 'Packing' || o.status === 'Picking') {
        statusBadge = '<span class="badge badge-warning">⚡ ' + o.status + '</span>';
      }

      // Customer tier pill
      let tierBadge = '<span class="badge badge-neutral">' + o.customerTier + '</span>';
      if (o.customerTier.includes('VIP')) {
        tierBadge = '<span class="badge badge-vip">⭐ ' + o.customerTier + '</span>';
      }

      // Items summary
      const itemsSummary = o.items.map(i => `${i.requestedQty}x ${i.name.substring(0, 20)}...`).join(', ');

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="score-pill ${scoreClass}">${o.priorityScore}</span>
              <div>
                <a href="javascript:void(0)" onclick="OrdersModule.openOrderDetailModal('${o.id}')" style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--accent-primary); text-decoration: none;">
                  ${o.id}
                </a>
                <div style="font-size: 0.7rem; color: var(--text-muted);">${o.orderDate}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight: 600;">${o.customer}</div>
            <div style="margin-top: 2px;">${tierBadge}</div>
          </td>
          <td>
            <div style="font-size: 0.8rem; color: var(--text-primary);">${itemsSummary}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">$${(o.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </td>
          <td>
            <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">
              ⏰ ${o.deadline}
            </div>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="font-size: 0.75rem; color: var(--text-secondary); max-width: 260px;" title="${o.priorityReason}">
              ${o.manualOverride ? '<span style="color: var(--accent-purple); font-weight: 700;">[OVERRIDE] </span>' : ''}
              ${o.priorityReason}
            </div>
          </td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-secondary btn-sm" onclick="OrdersModule.openOrderDetailModal('${o.id}')" title="View Full Lifecycle Stepper">
                👁️ Stepper
              </button>
              <button class="btn btn-ghost btn-sm" onclick="OrdersModule.openOverrideModal('${o.id}')" title="Manual Priority Override">
                ⚙️ Override
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openOrderDetailModal(orderId) {
    const store = window.stateStore;
    const order = store.getOrderById(orderId);
    if (!order) return;

    this.selectedOrderId = orderId;
    const modal = document.getElementById('modal-order-detail');
    const title = document.getElementById('modal-order-detail-title');
    const body = document.getElementById('modal-order-detail-body');

    if (title) title.textContent = `Order Lifecycle: ${order.id} (${order.customer})`;

    if (body) {
      // Build 9-stage visual stepper
      const stages = [
        'Order Created',
        'Priority Computed',
        'Stock Allocated',
        'Picking',
        'Packing',
        'Quality Check',
        'Dispatched'
      ];

      const currentStageIndex = stages.findIndex(s => s.toLowerCase() === order.status.toLowerCase());

      body.innerHTML = `
        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 1.1rem; font-weight: 700;">${order.customer}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">Tier: ${order.customerTier} • Destination: ${order.shippingAddress}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-cyan);">$${(order.totalValue || 0).toFixed(2)}</div>
              <div style="font-size: 0.75rem; color: var(--status-warning);">SLA Deadline: ${order.deadline}</div>
            </div>
          </div>
        </div>

        <div style="font-weight: 700; margin-bottom: 0.5rem; font-size: 0.88rem;">Fulfillment Stepper Progress</div>
        <div class="stepper-container">
          <div class="stepper-progress-line"></div>
          ${stages.map((stageName, idx) => {
            const isCompleted = order.lifecycle && order.lifecycle.find(l => l.stage === stageName && l.completed);
            const isCurrent = order.status === stageName || (idx === currentStageIndex);
            
            return `
              <div class="step-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}">
                <div class="step-circle">${isCompleted ? '✓' : (idx + 1)}</div>
                <div class="step-label">${stageName}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top: 1.5rem;">
          <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 0.5rem;">Order Line Items & Reservation</div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Bin</th>
                  <th>Requested</th>
                  <th>Allocated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td style="font-family: monospace; font-weight: 700;">${item.sku}</td>
                    <td>${item.name}</td>
                    <td><span class="badge badge-neutral">${item.binLocation || 'Zone A'}</span></td>
                    <td>${item.requestedQty}</td>
                    <td><strong>${item.allocatedQty || 0}</strong></td>
                    <td>
                      ${item.fulfilled 
                        ? '<span class="badge badge-success">✓ 100% Reserved</span>' 
                        : `<span class="badge badge-critical">⚠️ Shortfall (${item.requestedQty - (item.allocatedQty || 0)} missing)</span>`
                      }
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div style="margin-top: 1.25rem;">
          <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 0.5rem;">Explainable Decision Breakdown</div>
          <div class="copilot-reason-box" style="background: var(--bg-tertiary); padding: 0.75rem; border-radius: var(--radius-md);">
            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Priority Score: ${order.priorityScore} / 100</div>
            <div>${order.priorityReason}</div>
          </div>
        </div>
      `;
    }

    if (modal) modal.classList.add('active');
  },

  openOverrideModal(orderId) {
    const store = window.stateStore;
    const order = store.getOrderById(orderId);
    if (!order) return;

    const modal = document.getElementById('modal-priority-override');
    const orderIdField = document.getElementById('override-order-id');
    const infoField = document.getElementById('override-order-info');
    const scoreInput = document.getElementById('override-score-input');

    if (orderIdField) orderIdField.value = order.id;
    if (infoField) infoField.textContent = `${order.id} - ${order.customer} (Current Score: ${order.priorityScore})`;
    if (scoreInput) scoreInput.value = order.priorityScore;

    if (modal) modal.classList.add('active');
  },

  submitOverride(e) {
    if (e) e.preventDefault();
    const orderId = document.getElementById('override-order-id')?.value;
    const score = parseInt(document.getElementById('override-score-input')?.value, 10);
    const reason = document.getElementById('override-reason-input')?.value;

    if (!orderId || isNaN(score) || !reason) {
      alert('Please provide a score and valid justification reason.');
      return;
    }

    const store = window.stateStore;
    store.overrideOrderPriority(orderId, score, reason);
    document.getElementById('modal-priority-override')?.classList.remove('active');
  }
};

window.OrdersModule = OrdersModule;
