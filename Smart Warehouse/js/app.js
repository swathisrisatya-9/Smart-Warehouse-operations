/**
 * SmartWarehouse AI - Master Application Controller & Router
 * Orchestrates module lifecycle, view navigation, modal management, and live simulation heartbeat.
 */

class WarehouseAppRouter {
  constructor() {
    this.currentView = 'dashboard';
    this.viewTitles = {
      'dashboard': 'Executive Dashboard & Operations Hub',
      'inventory': 'Inventory Catalog & Bin Locations',
      'orders': 'Order Prioritization & SLA Engine',
      'allocation': 'Rules-Based Allocation Engine & Decision Matrix',
      'pick-pack': 'Route-Optimized Wave Picking & Packing',
      'reorder': 'Smart Velocity Reorder & Stockout Predictor',
      'exceptions': 'Damaged / Missing Item Exception Workflows',
      'qc-dispatch': 'Quality Control, Dispatch & Order Stepper',
      'analytics': 'Operational Bottlenecks & Labor Analytics'
    };
  }

  init() {
    this.bindNavigation();
    this.bindModals();
    this.bindThemeToggle();
    this.initHeartbeat();

    // Initialize all components
    if (window.DecisionAssistant) window.DecisionAssistant.init();
    if (window.NotificationsComponent) window.NotificationsComponent.init();
    if (window.GlobalSearch) window.GlobalSearch.init();
    if (window.RoleSwitcher) window.RoleSwitcher.init();
    if (window.DemoScenarios) window.DemoScenarios.init();

    // Initialize all modules
    if (window.DashboardModule) window.DashboardModule.init();
    if (window.InventoryModule) window.InventoryModule.init();
    if (window.OrdersModule) window.OrdersModule.init();
    if (window.AllocationModule) window.AllocationModule.init();
    if (window.PickPackModule) window.PickPackModule.init();
    if (window.ReorderModule) window.ReorderModule.init();
    if (window.ExceptionsModule) window.ExceptionsModule.init();
    if (window.QCDispatchModule) window.QCDispatchModule.init();
    if (window.AnalyticsModule) window.AnalyticsModule.init();

    // Default route
    this.navigateTo(this.currentView);
  }

  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-target');
        this.navigateTo(targetView);
      });
    });
  }

  navigateTo(viewId) {
    if (!this.viewTitles[viewId]) viewId = 'dashboard';
    this.currentView = viewId;

    // Update active nav link
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-target') === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Toggle view panels
    document.querySelectorAll('.module-view').forEach(view => {
      if (view.id === `view-${viewId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Update Header Title
    const headerTitle = document.getElementById('view-current-title');
    if (headerTitle) {
      headerTitle.textContent = this.viewTitles[viewId];
    }

    // Refresh module specific renders
    if (viewId === 'dashboard' && window.DashboardModule) window.DashboardModule.render();
    if (viewId === 'inventory' && window.InventoryModule) window.InventoryModule.render();
    if (viewId === 'orders' && window.OrdersModule) window.OrdersModule.render();
    if (viewId === 'allocation' && window.AllocationModule) window.AllocationModule.render();
    if (viewId === 'pick-pack' && window.PickPackModule) window.PickPackModule.render();
    if (viewId === 'reorder' && window.ReorderModule) window.ReorderModule.render();
    if (viewId === 'exceptions' && window.ExceptionsModule) window.ExceptionsModule.render();
    if (viewId === 'qc-dispatch' && window.QCDispatchModule) window.QCDispatchModule.render();
    if (viewId === 'analytics' && window.AnalyticsModule) window.AnalyticsModule.render();
  }

  bindModals() {
    // Close modal on click of [data-close-modal] or backdrop
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
    });
  }

  bindThemeToggle() {
    const themeBtn = document.getElementById('btn-toggle-theme');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const newTheme = window.stateStore.currentTheme === 'dark' ? 'light' : 'dark';
        window.stateStore.setTheme(newTheme);
        themeBtn.textContent = newTheme === 'dark' ? '🌙' : '☀️';
      });
      themeBtn.textContent = window.stateStore.currentTheme === 'dark' ? '🌙' : '☀️';
    }
  }

  initHeartbeat() {
    // Update live clock every second
    const clockEl = document.getElementById('live-sim-clock');
    const updateClock = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString();
      }
    };
    updateClock();
    setInterval(updateClock, 1000);
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.appRouter = new WarehouseAppRouter();
  window.appRouter.init();
});
