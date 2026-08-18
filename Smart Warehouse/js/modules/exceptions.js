/**
 * SmartWarehouse AI - Damaged / Missing Item Exception Management Module
 * Handles damaged/missing goods reporting, inventory write-offs, and allocation recovery workflows.
 */

const ExceptionsModule = {
  statusFilter: 'all',

  init() {
    this.render();
    window.stateStore.on('state:change', () => this.render());
    window.stateStore.on('exception:created', () => this.render());
    window.stateStore.on('exception:resolved', () => this.render());
  },

  render() {
    const store = window.stateStore;
    const exceptions = store.getExceptions();

    const filtered = exceptions.filter(e => {
      if (this.statusFilter === 'all') return true;
      return e.status.toLowerCase() === this.statusFilter.toLowerCase();
    });

    this.renderExceptionsTable(filtered);
  },

  renderExceptionsTable(exceptions) {
    const tbody = document.getElementById('exceptions-table-body');
    if (!tbody) return;

    if (exceptions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No recorded warehouse exceptions.</td></tr>`;
      return;
    }

    tbody.innerHTML = exceptions.map(e => {
      let statusBadge = '<span class="badge badge-warning">Open</span>';
      if (e.status === 'Resolved') statusBadge = '<span class="badge badge-success">✓ Resolved</span>';
      else if (e.status === 'Escalated') statusBadge = '<span class="badge badge-critical">🚨 Escalated</span>';

      return `
        <tr>
          <td>
            <strong style="font-family: monospace; color: var(--status-critical);">${e.id}</strong>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${e.reportedAt}</div>
          </td>
          <td>
            <div style="font-weight: 700;">${e.orderId !== 'N/A' ? e.orderId : 'Warehouse Bin Floor'}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Reported by: ${e.reportedBy}</div>
          </td>
          <td>
            <div style="font-weight: 600; font-size: 0.84rem;">${e.productName}</div>
            <div style="font-size: 0.72rem; font-family: monospace; color: var(--accent-cyan);">${e.sku} (Bin: ${e.binLocation})</div>
          </td>
          <td>
            <strong style="color: var(--status-critical); font-size: 0.95rem;">${e.qtyAffected} unit(s)</strong>
            <div style="font-size: 0.72rem; color: var(--text-secondary);">${e.reasonType}</div>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="font-size: 0.75rem; color: var(--text-secondary); max-width: 250px;">
              ${e.status === 'Resolved' ? `<span style="color: var(--status-success);">✓ ${e.actionTaken}</span>` : e.systemRecommendation}
            </div>
          </td>
          <td>
            ${e.status === 'Open' ? `
              <button class="btn btn-primary btn-sm" onclick="ExceptionsModule.openResolveModal('${e.id}')">
                ⚙️ Resolve
              </button>
            ` : `<span style="font-size: 0.75rem; color: var(--text-muted);">Closed</span>`}
          </td>
        </tr>
      `;
    }).join('');
  },

  openReportModal(orderId = null) {
    const store = window.stateStore;
    const modal = document.getElementById('modal-report-exception');
    const orderSelect = document.getElementById('report-exc-order-id');
    const skuSelect = document.getElementById('report-exc-sku');

    if (orderSelect) {
      const orders = store.getOrders();
      orderSelect.innerHTML = `<option value="N/A">None (General Bin Damage)</option>` + orders.map(o => `
        <option value="${o.id}" ${orderId === o.id ? 'selected' : ''}>${o.id} - ${o.customer}</option>
      `).join('');
    }

    if (skuSelect) {
      const products = store.getProducts();
      skuSelect.innerHTML = products.map(p => `
        <option value="${p.sku}">${p.name} (${p.sku}) [Bin: ${p.binLocation}]</option>
      `).join('');
    }

    if (modal) modal.classList.add('active');
  },

  submitException(e) {
    if (e) e.preventDefault();
    const orderId = document.getElementById('report-exc-order-id')?.value;
    const sku = document.getElementById('report-exc-sku')?.value;
    const qty = parseInt(document.getElementById('report-exc-qty')?.value, 10) || 1;
    const reasonType = document.getElementById('report-exc-reason')?.value;
    const reportedBy = document.getElementById('report-exc-reporter')?.value || 'Elena Rostova (PICK-02)';
    const notes = document.getElementById('report-exc-notes')?.value;

    const store = window.stateStore;
    store.reportException({
      orderId,
      sku,
      qtyAffected: qty,
      reasonType,
      severity: 'High',
      reportedBy,
      notes
    });

    document.getElementById('modal-report-exception')?.classList.remove('active');
  },

  openResolveModal(excId) {
    const store = window.stateStore;
    const exc = store.getExceptions().find(e => e.id === excId);
    if (!exc) return;

    const modal = document.getElementById('modal-resolve-exception');
    const excIdField = document.getElementById('resolve-exc-id');
    const descField = document.getElementById('resolve-exc-desc');

    if (excIdField) excIdField.value = excId;
    if (descField) descField.textContent = `${exc.id}: ${exc.qtyAffected}x ${exc.productName} (${exc.reasonType})`;

    if (modal) modal.classList.add('active');
  },

  submitResolution(e) {
    if (e) e.preventDefault();
    const excId = document.getElementById('resolve-exc-id')?.value;
    const action = document.getElementById('resolve-exc-action')?.value || 'Quarantined item and fulfilled replacement';

    if (!excId) return;

    const store = window.stateStore;
    store.resolveException(excId, action);
    document.getElementById('modal-resolve-exception')?.classList.remove('active');
  }
};

window.ExceptionsModule = ExceptionsModule;
