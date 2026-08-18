/**
 * SmartWarehouse AI - Inventory & Stock Monitoring Module
 * Manages product catalog, bin locations, stock movements, and real-time inventory adjustments.
 */

const InventoryModule = {
  currentFilter: 'all',
  currentCategory: 'all',
  searchQuery: '',
  activeTab: 'table', // 'table' | 'bin-map'

  init() {
    this.bindEvents();
    this.render();
    window.stateStore.on('state:change', () => this.render());
    window.stateStore.on('inventory:updated', () => this.render());
  },

  bindEvents() {
    const searchInput = document.getElementById('inventory-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.render();
      });
    }

    const categorySelect = document.getElementById('inventory-category-filter');
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        this.currentCategory = e.target.value;
        this.render();
      });
    }

    const healthSelect = document.getElementById('inventory-health-filter');
    if (healthSelect) {
      healthSelect.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.render();
      });
    }
  },

  render() {
    const store = window.stateStore;
    const products = store.getProducts();
    const bins = store.data.bins || [];

    // Filter products
    const filtered = products.filter(p => {
      const matchesSearch = !this.searchQuery || 
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.sku.toLowerCase().includes(this.searchQuery) ||
        p.binLocation.toLowerCase().includes(this.searchQuery);

      const matchesCat = this.currentCategory === 'all' || p.category === this.currentCategory;

      let matchesHealth = true;
      if (this.currentFilter === 'healthy') matchesHealth = p.available > p.reorderThreshold;
      else if (this.currentFilter === 'low') matchesHealth = p.available > 0 && p.available <= p.reorderThreshold;
      else if (this.currentFilter === 'critical') matchesHealth = p.available === 0;

      return matchesSearch && matchesCat && matchesHealth;
    });

    this.renderTable(filtered);
    this.renderBinMap(bins, products);
  },

  renderTable(products) {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-muted);">No products match your filter criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => {
      let healthBadge = '<span class="badge badge-success">Healthy</span>';
      if (p.available === 0) {
        healthBadge = '<span class="badge badge-critical">Out of Stock</span>';
      } else if (p.available <= p.reorderThreshold) {
        healthBadge = '<span class="badge badge-warning">Low Stock</span>';
      }

      return `
        <tr>
          <td>
            <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--accent-cyan);">${p.sku}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${p.name}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${p.dimensions} • ${p.weightKg} kg</div>
          </td>
          <td><span class="badge badge-neutral">${p.category}</span></td>
          <td>
            <strong style="font-size: 0.95rem;">${p.available}</strong>
            <span style="font-size: 0.72rem; color: var(--text-muted);"> / ${p.quantity} on-hand</span>
          </td>
          <td>
            <span style="color: var(--status-warning); font-weight: 600;">${p.reserved}</span>
          </td>
          <td>
            <span class="badge badge-neutral" style="font-family: monospace;">📍 ${p.binLocation}</span>
          </td>
          <td>${healthBadge}</td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-secondary btn-sm" onclick="InventoryModule.openHistoryModal('${p.sku}')" title="View Stock Movement Audit Trail">
                📜 Logs
              </button>
              <button class="btn btn-primary btn-sm" onclick="InventoryModule.openAdjustModal('${p.sku}')" title="Adjust / Receive Stock">
                ⚙️ Adjust
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderBinMap(bins, products) {
    const container = document.getElementById('inventory-bin-grid');
    if (!container) return;

    container.innerHTML = bins.map(b => {
      const skusInBin = products.filter(p => p.binLocation === b.id);
      const totalUnits = skusInBin.reduce((acc, curr) => acc + curr.quantity, 0);
      const pctOccupied = Math.min(100, Math.round((totalUnits / b.capacity) * 100));

      let barColor = 'var(--status-info)';
      if (pctOccupied >= 90) barColor = 'var(--status-critical)';
      else if (pctOccupied >= 75) barColor = 'var(--status-warning)';

      return `
        <div class="bin-card" onclick="InventoryModule.filterByBin('${b.id}')">
          <div class="bin-header">
            <span class="bin-id">${b.id}</span>
            <span class="badge badge-neutral">${pctOccupied}%</span>
          </div>
          <div class="bin-zone">${b.zone}</div>
          <div class="bin-progress-bar">
            <div class="bin-progress-fill" style="width: ${pctOccupied}%; background: ${barColor};"></div>
          </div>
          <div class="bin-meta">
            <span>${totalUnits} / ${b.capacity} units</span>
            <span>${skusInBin.length} SKU(s)</span>
          </div>
        </div>
      `;
    }).join('');
  },

  filterByBin(binId) {
    const searchInput = document.getElementById('inventory-search-input');
    if (searchInput) {
      searchInput.value = binId;
      this.searchQuery = binId.toLowerCase();
      this.render();
    }
  },

  openHistoryModal(sku) {
    const store = window.stateStore;
    const product = store.getProductBySku(sku);
    if (!product) return;

    const modal = document.getElementById('modal-stock-history');
    const content = document.getElementById('modal-history-content');
    const title = document.getElementById('modal-history-title');

    if (title) title.textContent = `Stock Movement Audit Trail: ${product.name} (${sku})`;

    if (content) {
      content.innerHTML = `
        <div style="margin-bottom: 1rem; display: flex; gap: 1.5rem; background: var(--bg-tertiary); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
          <div><span style="color: var(--text-muted); font-size: 0.75rem;">Bin Location:</span> <strong>${product.binLocation}</strong></div>
          <div><span style="color: var(--text-muted); font-size: 0.75rem;">Total Stock:</span> <strong>${product.quantity}</strong></div>
          <div><span style="color: var(--text-muted); font-size: 0.75rem;">Reserved:</span> <strong style="color: var(--status-warning);">${product.reserved}</strong></div>
          <div><span style="color: var(--text-muted); font-size: 0.75rem;">Available:</span> <strong style="color: var(--status-success);">${product.available}</strong></div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Delta</th>
                <th>Movement Reason</th>
                <th>Author / Trigger</th>
              </tr>
            </thead>
            <tbody>
              ${(product.history || []).map(h => `
                <tr>
                  <td style="font-size: 0.78rem;">${h.date}</td>
                  <td>
                    <span class="badge ${h.change.startsWith('+') ? 'badge-success' : 'badge-critical'}" style="font-family: monospace;">
                      ${h.change}
                    </span>
                  </td>
                  <td>${h.type}</td>
                  <td style="color: var(--text-muted); font-size: 0.78rem;">${h.user}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    if (modal) modal.classList.add('active');
  },

  openAdjustModal(sku) {
    const store = window.stateStore;
    const product = store.getProductBySku(sku);
    if (!product) return;

    const modal = document.getElementById('modal-stock-adjust');
    const skuField = document.getElementById('adjust-sku-val');
    const nameField = document.getElementById('adjust-name-val');
    const currField = document.getElementById('adjust-curr-val');

    if (skuField) skuField.value = sku;
    if (nameField) nameField.textContent = `${product.name} (${product.binLocation})`;
    if (currField) currField.textContent = `${product.available} available (${product.quantity} total)`;

    if (modal) modal.classList.add('active');
  },

  submitAdjustment(e) {
    if (e) e.preventDefault();
    const sku = document.getElementById('adjust-sku-val')?.value;
    const delta = parseInt(document.getElementById('adjust-delta-val')?.value, 10);
    const reason = document.getElementById('adjust-reason-val')?.value || 'Manual Stock Adjustment';

    if (!sku || isNaN(delta)) return;

    const store = window.stateStore;
    store.updateProductStock(sku, delta, reason, 'Warehouse Manager');
    
    // Close modal
    document.getElementById('modal-stock-adjust')?.classList.remove('active');
  }
};

window.InventoryModule = InventoryModule;
