/**
 * SmartWarehouse AI - Dashboard Module
 * Handles executive overview KPI metrics, Chart.js visualizations, and the "Action Needed" priority panel.
 */

const DashboardModule = {
  chartInstances: {},

  init() {
    this.render();
    window.stateStore.on('state:change', () => this.render());
    window.stateStore.on('theme:changed', () => this.initCharts());
  },

  render() {
    const store = window.stateStore;
    const metrics = store.getMetrics();
    const orders = store.getOrders();
    const products = store.getProducts();

    // 1. Update KPI Values
    this.updateElementText('kpi-total-orders', metrics.totalOrders);
    this.updateElementText('kpi-pending-orders', metrics.pendingOrders);
    this.updateElementText('kpi-low-stock', metrics.lowStockCount + metrics.outOfStockCount);
    this.updateElementText('kpi-sla-risk', metrics.slaRiskOrders);

    // 2. Render Urgent "Action Needed" Decision Cards
    this.renderActionNeededCards();

    // 3. Render Top SKUs table
    this.renderTopSkusTable(products);

    // 4. Render / Update Charts
    this.initCharts();
  },

  updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

  renderActionNeededCards() {
    const container = document.getElementById('dashboard-action-needed-list');
    if (!container) return;

    const store = window.stateStore;
    const decisions = store.getDecisionsLog().slice(0, 3);

    if (decisions.length === 0) {
      container.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">
          ✨ All operations are optimal. No critical manual interventions pending.
        </div>`;
      return;
    }

    container.innerHTML = decisions.map(d => `
      <div class="decision-card">
        <div class="decision-header">
          <span class="decision-category">${d.category}</span>
          <span class="badge badge-warning">${d.timestamp}</span>
        </div>
        <div class="decision-title">${d.title}</div>
        <div class="decision-row">
          <div><span class="decision-tag-what">WHAT HAPPENED:</span> ${d.whatHappened}</div>
          <div><span class="decision-tag-why">WHY:</span> ${d.whyItHappened}</div>
        </div>
        <div class="decision-box-rec">
          <div>
            <span class="decision-tag-rec">RECOMMENDATION:</span>
            <span style="font-size: 0.8rem; color: var(--text-primary); margin-left: 4px;">${d.systemRecommendation}</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="DashboardModule.handleActionClick('${d.category}')">
            Review Action
          </button>
        </div>
      </div>
    `).join('');
  },

  handleActionClick(category) {
    if (category.includes('Stock') || category.includes('Scarcity')) {
      window.appRouter.navigateTo('allocation');
    } else if (category.includes('Reorder')) {
      window.appRouter.navigateTo('reorder');
    } else if (category.includes('Bottleneck')) {
      window.appRouter.navigateTo('analytics');
    } else if (category.includes('Exception')) {
      window.appRouter.navigateTo('exceptions');
    } else {
      window.appRouter.navigateTo('orders');
    }
  },

  renderTopSkusTable(products) {
    const container = document.getElementById('dashboard-top-skus-body');
    if (!container) return;

    const sorted = [...products].sort((a, b) => (b.dailyDemandVelocity || 0) - (a.dailyDemandVelocity || 0)).slice(0, 5);

    container.innerHTML = sorted.map(p => `
      <tr>
        <td>
          <div style="font-weight: 600;">${p.name}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">${p.sku}</div>
        </td>
        <td><span class="badge badge-neutral">${p.binLocation}</span></td>
        <td><strong>${p.available}</strong> / ${p.quantity}</td>
        <td>
          <span style="color: var(--accent-cyan); font-weight: 700;">${p.dailyDemandVelocity}</span> units/day
        </td>
        <td>
          ${p.available === 0 
            ? '<span class="badge badge-critical">Out of Stock</span>'
            : p.available <= p.reorderThreshold 
              ? '<span class="badge badge-warning">Low Stock</span>' 
              : '<span class="badge badge-success">Healthy</span>'
          }
        </td>
      </tr>
    `).join('');
  },

  initCharts() {
    if (typeof Chart === 'undefined') return;

    const store = window.stateStore;
    const orders = store.getOrders();
    const isDark = store.currentTheme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

    // Chart 1: Order Fulfillment Status (Doughnut)
    const donutCtx = document.getElementById('chart-order-status');
    if (donutCtx) {
      if (this.chartInstances['orderStatus']) {
        this.chartInstances['orderStatus'].destroy();
      }

      const statusCounts = {
        'Pending': orders.filter(o => o.status === 'Pending Allocation' || o.status === 'Allocated').length,
        'Picking': orders.filter(o => o.status === 'Picking').length,
        'Packing': orders.filter(o => o.status === 'Packing').length,
        'Quality Check': orders.filter(o => o.status === 'Quality Check').length,
        'Dispatched': orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered').length,
        'Exception': orders.filter(o => o.status === 'Exception').length
      };

      this.chartInstances['orderStatus'] = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(statusCounts),
          datasets: [{
            data: Object.values(statusCounts),
            backgroundColor: ['#6366f1', '#3b82f6', '#f59e0b', '#06b6d4', '#10b981', '#ef4444'],
            borderWidth: 2,
            borderColor: isDark ? '#101522' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12, font: { size: 11 } } }
          },
          cutout: '70%'
        }
      });
    }

    // Chart 2: Hourly Dispatch Throughput (Bar & Line)
    const trendCtx = document.getElementById('chart-fulfillment-trend');
    if (trendCtx) {
      if (this.chartInstances['fulfillmentTrend']) {
        this.chartInstances['fulfillmentTrend'].destroy();
      }

      this.chartInstances['fulfillmentTrend'] = new Chart(trendCtx, {
        type: 'bar',
        data: {
          labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
          datasets: [
            {
              label: 'Dispatched Orders',
              data: [14, 28, 42, 35, 18, 48, 52, 38],
              backgroundColor: 'rgba(99, 102, 241, 0.65)',
              borderRadius: 6
            },
            {
              type: 'line',
              label: 'Target Throughput (SLA)',
              data: [20, 25, 30, 30, 25, 35, 40, 35],
              borderColor: '#10b981',
              borderWidth: 2,
              pointRadius: 3,
              fill: false,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { color: textColor, boxWidth: 12 } }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          }
        }
      });
    }
  }
};

window.DashboardModule = DashboardModule;
