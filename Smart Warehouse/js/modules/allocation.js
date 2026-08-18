/**
 * SmartWarehouse AI - Inventory Allocation Engine Workbench
 * Visualizes the decision-making core: scarcity resolution, priority reservation, and plain-English decision logs.
 */

const AllocationModule = {
  lastSimulation: null,

  init() {
    this.render();
    window.stateStore.on('state:change', () => this.render());
    window.stateStore.on('allocation:resolved', () => this.render());
  },

  render() {
    const store = window.stateStore;
    const orders = store.getOrders();
    const products = store.getProducts();

    // Run simulation
    const sim = AllocationEngine.simulateAllocation(orders, products);
    this.lastSimulation = sim;

    this.renderAllocationTable(sim.results);
    this.renderDecisionLogs(sim.decisionLogs);
    this.renderScarcityAlerts(sim.results);
  },

  renderAllocationTable(results) {
    const tbody = document.getElementById('allocation-table-body');
    if (!tbody) return;

    tbody.innerHTML = results.map(r => {
      let statusBadge = '<span class="badge badge-success">Fully Allocated</span>';
      if (r.status === 'Partial Allocation') {
        statusBadge = `<span class="badge badge-warning">⚠️ Partial (${r.details.missingUnits || 1} units short)</span>`;
      } else if (r.status.includes('Conflict')) {
        statusBadge = `<span class="badge badge-critical">🚨 Stockout Conflict</span>`;
      }

      // Resolution buttons if partial or conflict
      let actionsHtml = `<span style="color: var(--text-muted); font-size: 0.75rem;">Ready to Pick</span>`;
      if (r.status !== 'Fully Allocated') {
        actionsHtml = `
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="AllocationModule.handleSplitShipment('${r.orderId}')" title="Ship In-Stock Units Now">
              ⚡ Split Ship
            </button>
            ${r.details.shortfallSku ? `
              <button class="btn btn-secondary btn-sm" onclick="AllocationModule.openSubstituteModal('${r.orderId}', '${r.details.shortfallSku}')" title="Substitute with Alternative SKU">
                🔄 Substitute
              </button>
            ` : ''}
            <button class="btn btn-ghost btn-sm" onclick="AllocationModule.handleBackorder('${r.orderId}')" title="Hold Full Order for Inbound PO">
              ⏳ Backorder
            </button>
          </div>
        `;
      }

      return `
        <tr>
          <td>
            <strong style="font-family: monospace; color: var(--text-primary);">${r.orderId}</strong>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Rank #${results.indexOf(r) + 1}</div>
          </td>
          <td>
            <div style="font-weight: 600;">${r.customer}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${r.customerTier}</div>
          </td>
          <td>
            <span class="score-pill ${r.priorityScore >= 80 ? 'score-critical' : 'score-medium'}">${r.priorityScore}</span>
          </td>
          <td>
            <div style="font-size: 0.78rem;">
              ${r.items.map(i => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span>${i.requestedQty}x ${i.name.substring(0, 18)}...</span>
                  <strong style="color: ${i.fulfilled ? 'var(--status-success)' : 'var(--status-critical)'};">
                    ${i.allocatedQty}/${i.requestedQty}
                  </strong>
                </div>
              `).join('')}
            </div>
          </td>
          <td>${statusBadge}</td>
          <td>${actionsHtml}</td>
        </tr>
      `;
    }).join('');
  },

  renderDecisionLogs(logs) {
    const container = document.getElementById('allocation-decision-logs-list');
    if (!container) return;

    if (logs.length === 0) {
      container.innerHTML = `<div style="padding: 1rem; color: var(--text-muted); text-align: center;">No decision logs recorded.</div>`;
      return;
    }

    container.innerHTML = logs.map(log => `
      <div class="decision-card" style="margin-bottom: 0.75rem;">
        <div class="decision-header">
          <span class="decision-category" style="font-weight: 700;">${log.orderId} • ${log.priorityRank}</span>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${log.customer}</span>
        </div>
        <div class="decision-row">
          <div><span class="decision-tag-what">DECISION:</span> ${log.what}</div>
          <div><span class="decision-tag-why">RATIONALE:</span> ${log.why}</div>
        </div>
        <div class="decision-box-rec" style="padding: 0.4rem 0.65rem;">
          <span style="font-size: 0.76rem; color: var(--status-success);">💡 <strong>Next Action:</strong> ${log.recommendation}</span>
        </div>
      </div>
    `).join('');
  },

  renderScarcityAlerts(results) {
    const container = document.getElementById('allocation-scarcity-banner');
    if (!container) return;

    const shortages = results.filter(r => r.status !== 'Fully Allocated');
    if (shortages.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); padding: 0.85rem 1.25rem; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.3rem;">⚠️</span>
          <div>
            <strong style="color: var(--status-critical); font-size: 0.9rem;">Inventory Shortage Detected across ${shortages.length} Pending Orders</strong>
            <div style="font-size: 0.78rem; color: var(--text-secondary);">The Allocation Engine has prioritized VIP orders and flagged shortfall resolutions below.</div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="AllocationModule.runAutoOptimize()">
          ⚡ Auto-Apply Optimal Resolutions
        </button>
      </div>
    `;
  },

  handleSplitShipment(orderId) {
    AllocationEngine.applySplitShipment(orderId);
  },

  handleBackorder(orderId) {
    AllocationEngine.applyBackorder(orderId);
  },

  openSubstituteModal(orderId, oldSku) {
    const store = window.stateStore;
    const product = store.getProductBySku(oldSku);
    const modal = document.getElementById('modal-substitute-sku');
    const orderField = document.getElementById('substitute-order-id');
    const oldSkuField = document.getElementById('substitute-old-sku');
    const descField = document.getElementById('substitute-sku-desc');
    const select = document.getElementById('substitute-new-sku-select');

    if (orderField) orderField.value = orderId;
    if (oldSkuField) oldSkuField.value = oldSku;
    if (descField) descField.textContent = `Replace missing "${product ? product.name : oldSku}" with an in-stock alternative for Order ${orderId}.`;

    // Populate alternative products with available stock
    if (select) {
      const candidates = store.getProducts().filter(p => p.sku !== oldSku && p.available > 0);
      select.innerHTML = candidates.map(c => `
        <option value="${c.sku}" ${product && product.substituteSKU === c.sku ? 'selected' : ''}>
          ${c.name} (${c.sku}) — ${c.available} available in ${c.binLocation} [+$0.00 VIP Promo]
        </option>
      `).join('');
    }

    if (modal) modal.classList.add('active');
  },

  submitSubstitute(e) {
    if (e) e.preventDefault();
    const orderId = document.getElementById('substitute-order-id')?.value;
    const oldSku = document.getElementById('substitute-old-sku')?.value;
    const newSku = document.getElementById('substitute-new-sku-select')?.value;

    if (!orderId || !oldSku || !newSku) return;

    AllocationEngine.applySubstituteSKU(orderId, oldSku, newSku);
    document.getElementById('modal-substitute-sku')?.classList.remove('active');
  },

  runAutoOptimize() {
    const store = window.stateStore;
    // Apply automatic resolution for ORD-9011 or ORD-9016
    const ord9011 = store.getOrderById('ORD-9011');
    if (ord9011 && ord9011.status === 'Pending Allocation') {
      AllocationEngine.applySplitShipment('ORD-9011');
    }
    const ord9016 = store.getOrderById('ORD-9016');
    if (ord9016) {
      AllocationEngine.applyBackorder('ORD-9016');
    }
    this.render();
  }
};

window.AllocationModule = AllocationModule;
