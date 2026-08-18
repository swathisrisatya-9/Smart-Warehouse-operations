/**
 * SmartWarehouse AI - Operational Analytics & Bottleneck Identification Module
 * Visualizes stage dwell times, bottleneck diagnosis, picker leaderboard, and CSV report export.
 */

const AnalyticsModule = {
  stageChart: null,

  init() {
    this.render();
    window.stateStore.on('state:change', () => this.render());
    window.stateStore.on('theme:changed', () => this.initStageChart());
  },

  render() {
    const store = window.stateStore;
    const orders = store.getOrders();
    const pickers = store.getPickers();

    const diagnosis = BottleneckEngine.diagnoseWarehouse(orders);

    this.renderBottleneckBanner(diagnosis);
    this.renderStageMetrics(diagnosis.stages);
    this.renderPickerLeaderboard(pickers);
    this.initStageChart(diagnosis.stages);
  },

  renderBottleneckBanner(diagnosis) {
    const container = document.getElementById('analytics-bottleneck-banner');
    if (!container) return;

    container.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.4rem;">🚨</span>
            <strong style="font-size: 1.05rem; color: var(--text-primary);">${diagnosis.diagnosticTitle}</strong>
          </div>
          <span class="badge badge-critical">${diagnosis.severityRatio}x Baseline Dwell Time</span>
        </div>
        <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">
          ${diagnosis.diagnosticWhy}
        </div>
        <div style="background: var(--bg-card); padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="font-weight: 700; font-size: 0.82rem; color: var(--status-success); margin-bottom: 0.35rem;">
            💡 Automated System Recommendations:
          </div>
          <ul style="padding-left: 1.25rem; font-size: 0.8rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.25rem;">
            ${diagnosis.recommendations.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  },

  renderStageMetrics(stages) {
    const container = document.getElementById('analytics-stage-metrics-grid');
    if (!container) return;

    container.innerHTML = stages.map(st => `
      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">${st.name}</span>
          <span class="badge ${st.healthBadge}">${st.healthStatus}</span>
        </div>
        <div class="kpi-value" style="color: ${st.ratio >= 1.5 ? 'var(--status-critical)' : 'var(--text-primary)'};">
          ${st.currentDwellMin} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">mins</span>
        </div>
        <div class="kpi-bottom">
          <span>Baseline: <strong>${st.baselineMin}m</strong></span>
          <span style="margin-left: auto;">${st.queueLength} in queue</span>
        </div>
      </div>
    `).join('');
  },

  renderPickerLeaderboard(pickers) {
    const container = document.getElementById('analytics-leaderboard-body');
    if (!container) return;

    // Sort pickers by accuracy rate & items picked
    const sorted = [...pickers].sort((a, b) => b.accuracyRate - a.accuracyRate || b.itemsPickedToday - a.itemsPickedToday);

    container.innerHTML = sorted.map((p, idx) => `
      <div class="leaderboard-row">
        <div class="leader-rank">#${idx + 1}</div>
        <div class="leader-info">
          <span class="leader-avatar">${p.avatar}</span>
          <div>
            <div class="leader-name">${p.name}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${p.zone} • ${p.status}</div>
          </div>
        </div>
        <div class="leader-stats">
          <div><strong style="color: var(--accent-cyan);">${p.itemsPickedToday}</strong> picked</div>
          <div><strong style="color: var(--status-success);">${p.accuracyRate}%</strong> accuracy</div>
          <div><strong>${p.avgPickSpeedSec}s</strong> speed</div>
        </div>
      </div>
    `).join('');
  },

  initStageChart(stagesData) {
    if (typeof Chart === 'undefined') return;

    const ctx = document.getElementById('chart-stage-dwell');
    if (!ctx) return;

    const store = window.stateStore;
    const isDark = store.currentTheme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

    if (this.stageChart) {
      this.stageChart.destroy();
    }

    const stages = stagesData || [
      { name: 'Allocation', currentDwellMin: 1.8, baselineMin: 3.0 },
      { name: 'Picking', currentDwellMin: 14.5, baselineMin: 15.0 },
      { name: 'Packing', currentDwellMin: 19.8, baselineMin: 6.0 },
      { name: 'Quality Check', currentDwellMin: 4.2, baselineMin: 5.0 },
      { name: 'Dispatch', currentDwellMin: 8.5, baselineMin: 10.0 }
    ];

    this.stageChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: stages.map(s => s.name),
        datasets: [
          {
            label: 'Current Dwell Time (Mins)',
            data: stages.map(s => s.currentDwellMin),
            backgroundColor: stages.map(s => s.currentDwellMin > s.baselineMin * 1.4 ? 'rgba(239, 68, 68, 0.75)' : 'rgba(99, 102, 241, 0.75)'),
            borderRadius: 6
          },
          {
            label: 'Benchmark Target (Mins)',
            data: stages.map(s => s.baselineMin),
            backgroundColor: 'rgba(100, 116, 139, 0.35)',
            borderRadius: 6
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
  },

  exportCSVReport() {
    const store = window.stateStore;
    const orders = store.getOrders();

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Order ID,Customer,Tier,Priority Score,Status,Value,Deadline,Carrier,Tracking Number\n';

    orders.forEach(o => {
      const row = [
        o.id,
        `"${o.customer}"`,
        `"${o.customerTier}"`,
        o.priorityScore,
        o.status,
        o.totalValue,
        `"${o.deadline}"`,
        `"${o.carrier || 'N/A'}"`,
        `"${o.trackingNumber || 'N/A'}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartWarehouse_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    store.addNotification({
      type: 'success',
      title: 'Report Downloaded',
      message: 'Warehouse operations CSV report generated successfully.',
      actionUrl: 'analytics'
    });
  }
};

window.AnalyticsModule = AnalyticsModule;
