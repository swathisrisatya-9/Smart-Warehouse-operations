/**
 * SmartWarehouse AI - Low Stock & Smart Reorder Engine Module
 * Detects stockout risks using velocity run-rates and allows one-click replenishment PO generation.
 */

const ReorderModule = {
  init() {
    this.render();
    window.stateStore.on('state:change', () => this.render());
    window.stateStore.on('inventory:updated', () => this.render());
  },

  render() {
    const store = window.stateStore;
    const products = store.getProducts();

    // Analyze all products with ReorderEngine
    const recommendations = ReorderEngine.getReorderRecommendations(products);

    this.renderAlertCards(recommendations);
    this.renderReorderTable(recommendations);
  },

  renderAlertCards(recommendations) {
    const container = document.getElementById('reorder-alert-summary');
    if (!container) return;

    const criticalCount = recommendations.filter(r => r.available === 0 || r.daysRemaining <= r.leadTimeDays).length;
    const totalPOCost = recommendations.reduce((acc, r) => acc + parseFloat(r.estimatedPOCost), 0);

    container.innerHTML = `
      <div class="kpi-card" style="border-left: 4px solid var(--status-critical);">
        <div class="kpi-top">
          <span class="kpi-label">Critical Stockout Items</span>
          <div class="kpi-icon-box kpi-icon-red">🚨</div>
        </div>
        <div class="kpi-value" style="color: var(--status-critical);">${criticalCount}</div>
        <div class="kpi-bottom">Immediate PO trigger required</div>
      </div>

      <div class="kpi-card" style="border-left: 4px solid var(--status-warning);">
        <div class="kpi-top">
          <span class="kpi-label">Total Low Stock Alerts</span>
          <div class="kpi-icon-box kpi-icon-amber">⚠️</div>
        </div>
        <div class="kpi-value">${recommendations.length}</div>
        <div class="kpi-bottom">Velocity > Safety Threshold</div>
      </div>

      <div class="kpi-card" style="border-left: 4px solid var(--accent-cyan);">
        <div class="kpi-top">
          <span class="kpi-label">Est. Replenishment Capital</span>
          <div class="kpi-icon-box kpi-icon-blue">💵</div>
        </div>
        <div class="kpi-value" style="font-size: 1.5rem;">$${totalPOCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div class="kpi-bottom">Across ${recommendations.length} supplier orders</div>
      </div>
    `;
  },

  renderReorderTable(recommendations) {
    const tbody = document.getElementById('reorder-table-body');
    if (!tbody) return;

    if (recommendations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--status-success); font-weight: 600;">✨ All items are adequately stocked above safety thresholds!</td></tr>`;
      return;
    }

    tbody.innerHTML = recommendations.map(r => `
      <tr>
        <td>
          <div style="font-weight: 700; font-family: monospace; color: var(--accent-cyan);">${r.sku}</div>
          <div style="font-weight: 600; font-size: 0.84rem;">${r.name}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Supplier: ${r.supplier}</div>
        </td>
        <td>
          <strong style="font-size: 0.95rem; color: ${r.available === 0 ? 'var(--status-critical)' : 'var(--text-primary)'};">
            ${r.available}
          </strong> / ${r.totalQty}
          <div style="font-size: 0.72rem; color: var(--status-warning);">(${r.reserved} reserved)</div>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--accent-primary);">${r.dailyVelocity} units/day</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Lead Time: ${r.leadTimeDays} days</div>
        </td>
        <td>
          <strong style="color: ${r.daysRemaining <= r.leadTimeDays ? 'var(--status-critical)' : 'var(--status-warning)'};">
            ${r.daysRemaining} days
          </strong>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${r.stockoutDateFormatted}</div>
        </td>
        <td>
          <div style="font-weight: 800; font-size: 0.95rem; color: var(--status-success);">
            +${r.suggestedReorderQty} units
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">$${r.estimatedPOCost} total</div>
        </td>
        <td>
          <span class="badge ${r.statusBadgeClass}">${r.statusLabel}</span>
          <div style="font-size: 0.72rem; color: var(--text-secondary); max-width: 200px; margin-top: 2px;">
            ${r.urgencyReason}
          </div>
        </td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="ReorderModule.openReplenishModal('${r.sku}', ${r.suggestedReorderQty})">
            ⚡ Generate PO
          </button>
        </td>
      </tr>
    `).join('');
  },

  openReplenishModal(sku, suggestedQty) {
    const store = window.stateStore;
    const product = store.getProductBySku(sku);
    if (!product) return;

    const modal = document.getElementById('modal-generate-po');
    const skuField = document.getElementById('po-sku-val');
    const nameField = document.getElementById('po-product-name');
    const supplierField = document.getElementById('po-supplier-val');
    const qtyInput = document.getElementById('po-qty-input');
    const costField = document.getElementById('po-total-cost');

    if (skuField) skuField.value = sku;
    if (nameField) nameField.textContent = `${product.name} (${sku})`;
    if (supplierField) supplierField.textContent = product.supplier || 'Tier-1 Supplier';
    if (qtyInput) {
      qtyInput.value = suggestedQty;
      qtyInput.oninput = () => {
        const q = parseInt(qtyInput.value, 10) || 0;
        if (costField) costField.textContent = `$${(q * product.unitPrice).toFixed(2)}`;
      };
    }
    if (costField) costField.textContent = `$${(suggestedQty * product.unitPrice).toFixed(2)}`;

    if (modal) modal.classList.add('active');
  },

  submitPO(e) {
    if (e) e.preventDefault();
    const sku = document.getElementById('po-sku-val')?.value;
    const qty = parseInt(document.getElementById('po-qty-input')?.value, 10);

    if (!sku || isNaN(qty)) return;

    ReorderEngine.executePOReplenishment(sku, qty);
    document.getElementById('modal-generate-po')?.classList.remove('active');
  }
};

window.ReorderModule = ReorderModule;
