/**
 * SmartWarehouse AI - Global Search (Command-K) Component
 * Instant omni-search across orders, SKUs, bins, floor staff, and exceptions.
 */

const GlobalSearch = {
  isOpen: false,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const searchTrigger = document.getElementById('btn-global-search');
    const modal = document.getElementById('modal-global-search');
    const input = document.getElementById('global-search-input');
    const closeBtn = document.getElementById('btn-close-search');

    if (searchTrigger) {
      searchTrigger.addEventListener('click', () => this.open());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Ctrl+K or Cmd+K shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.isOpen ? this.close() : this.open();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    if (input) {
      input.addEventListener('input', (e) => {
        this.performSearch(e.target.value.trim().toLowerCase());
      });
    }
  },

  open() {
    this.isOpen = true;
    const modal = document.getElementById('modal-global-search');
    const input = document.getElementById('global-search-input');
    if (modal) modal.classList.add('active');
    if (input) {
      input.value = '';
      input.focus();
      this.performSearch('');
    }
  },

  close() {
    this.isOpen = false;
    const modal = document.getElementById('modal-global-search');
    if (modal) modal.classList.remove('active');
  },

  performSearch(query) {
    const resultsContainer = document.getElementById('global-search-results');
    if (!resultsContainer) return;

    const store = window.stateStore;
    const orders = store.getOrders();
    const products = store.getProducts();
    const bins = store.data.bins || [];
    const exceptions = store.getExceptions();

    const matches = [];

    // Search Orders
    orders.forEach(o => {
      if (!query || o.id.toLowerCase().includes(query) || o.customer.toLowerCase().includes(query)) {
        matches.push({
          type: 'Order',
          icon: '📦',
          title: `${o.id} • ${o.customer}`,
          subtitle: `Status: ${o.status} | Value: $${(o.totalValue || 0).toFixed(2)} | Score: ${o.priorityScore}`,
          action: () => {
            this.close();
            window.appRouter.navigateTo('orders');
            window.OrdersModule.openOrderDetailModal(o.id);
          }
        });
      }
    });

    // Search Products
    products.forEach(p => {
      if (!query || p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query) || p.binLocation.toLowerCase().includes(query)) {
        matches.push({
          type: 'Product',
          icon: '🏷️',
          title: `${p.name}`,
          subtitle: `SKU: ${p.sku} | Available: ${p.available}/${p.quantity} | Bin: ${p.binLocation}`,
          action: () => {
            this.close();
            window.appRouter.navigateTo('inventory');
            window.InventoryModule.openHistoryModal(p.sku);
          }
        });
      }
    });

    // Search Bins
    bins.forEach(b => {
      if (query && (b.id.toLowerCase().includes(query) || b.zone.toLowerCase().includes(query))) {
        matches.push({
          type: 'Warehouse Bin',
          icon: '📍',
          title: `${b.id} (${b.zone})`,
          subtitle: `Capacity: ${b.capacity} units | Current: ${b.currentSKUs.join(', ')}`,
          action: () => {
            this.close();
            window.appRouter.navigateTo('inventory');
            window.InventoryModule.filterByBin(b.id);
          }
        });
      }
    });

    // Search Exceptions
    exceptions.forEach(e => {
      if (query && (e.id.toLowerCase().includes(query) || e.productName.toLowerCase().includes(query))) {
        matches.push({
          type: 'Exception',
          icon: '🚨',
          title: `${e.id} • ${e.productName}`,
          subtitle: `Reason: ${e.reasonType} | Status: ${e.status}`,
          action: () => {
            this.close();
            window.appRouter.navigateTo('exceptions');
          }
        });
      }
    });

    if (matches.length === 0) {
      resultsContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No matching records found for "${query}".</div>`;
      return;
    }

    // Bind action callbacks
    window._searchResults = matches;

    resultsContainer.innerHTML = matches.slice(0, 8).map((m, idx) => `
      <div class="notif-item" style="padding: 0.75rem 1rem; margin-bottom: 0.35rem;" onclick="window._searchResults[${idx}].action()">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.1rem;">${m.icon}</span>
            <strong style="font-size: 0.88rem; color: var(--text-primary);">${m.title}</strong>
          </div>
          <span class="badge badge-neutral">${m.type}</span>
        </div>
        <div style="font-size: 0.76rem; color: var(--text-muted); margin-left: 2rem;">${m.subtitle}</div>
      </div>
    `).join('');
  }
};

window.GlobalSearch = GlobalSearch;
