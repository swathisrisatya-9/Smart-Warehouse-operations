/**
 * SmartWarehouse AI - Decision Assistant Copilot Component
 * Persistent side drawer that surfaces top 3 actionable recommendations with 1-click execution.
 */

const DecisionAssistant = {
  isOpen: false,

  init() {
    this.bindEvents();
    this.render();
    window.stateStore.on('state:change', () => this.render());
  },

  bindEvents() {
    const triggerBtn = document.getElementById('btn-toggle-assistant');
    const closeBtn = document.getElementById('btn-close-assistant');

    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.toggle());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  },

  toggle() {
    this.isOpen ? this.close() : this.open();
  },

  open() {
    this.isOpen = true;
    const drawer = document.getElementById('decision-assistant-drawer');
    if (drawer) drawer.classList.add('open');
  },

  close() {
    this.isOpen = false;
    const drawer = document.getElementById('decision-assistant-drawer');
    if (drawer) drawer.classList.remove('open');
  },

  render() {
    const container = document.getElementById('copilot-recommendations-list');
    if (!container) return;

    const store = window.stateStore;
    const orders = store.getOrders();
    const products = store.getProducts();
    const exceptions = store.getExceptions();

    const recommendations = [];

    // 1. Stockout & Scarcity Recommendation
    const shortfallOrder = orders.find(o => o.status === 'Pending Allocation' || o.status === 'Stock Conflict (Delayed)');
    if (shortfallOrder) {
      recommendations.push({
        id: 'REC-ALLOC-1',
        type: 'scarcity',
        priority: 'CRITICAL',
        priorityClass: 'badge-critical',
        title: `Authorize Split Shipment for ${shortfallOrder.id}`,
        desc: `${shortfallOrder.customer} (VIP) is waiting on scarce line items. Dispatching on-hand inventory now protects SLA.`,
        reason: 'SLA deadline is under 2.5 hours. Stock shortage is on non-critical accessory line.',
        actionLabel: 'Apply Split Shipment',
        onExecute: () => {
          AllocationEngine.applySplitShipment(shortfallOrder.id);
          this.close();
        }
      });
    }

    // 2. Velocity Reorder Trigger
    const criticalProduct = products.find(p => p.available === 0 || p.available <= p.reorderThreshold);
    if (criticalProduct) {
      recommendations.push({
        id: 'REC-REORDER-1',
        type: 'reorder',
        priority: 'HIGH',
        priorityClass: 'badge-warning',
        title: `Generate PO for ${criticalProduct.name}`,
        desc: `Available stock is ${criticalProduct.available} units. Current velocity (${criticalProduct.dailyDemandVelocity}/day) will cause stockout within 48h.`,
        reason: `3 pending orders require this SKU. Supplier lead time is ${criticalProduct.leadTimeDays} days.`,
        actionLabel: `Reorder +${criticalProduct.reorderQtySuggestion} Units`,
        onExecute: () => {
          ReorderEngine.executePOReplenishment(criticalProduct.sku, criticalProduct.reorderQtySuggestion);
          this.close();
        }
      });
    }

    // 3. Exception Resolution
    const openExc = exceptions.find(e => e.status === 'Open');
    if (openExc) {
      recommendations.push({
        id: 'REC-EXC-1',
        type: 'exception',
        priority: 'HIGH',
        priorityClass: 'badge-warning',
        title: `Resolve Exception ${openExc.id}`,
        desc: `${openExc.qtyAffected}x ${openExc.productName} damaged during picking in ${openExc.binLocation}.`,
        reason: 'Order fulfillment is stalled. Quarantine item and substitute from reserve stock.',
        actionLabel: 'Auto-Resolve with Reserve',
        onExecute: () => {
          store.resolveException(openExc.id, 'Quarantined damaged stock and allocated replacement from Reserve Shelf B1-02');
          this.close();
        }
      });
    }

    // 4. Bottleneck Remediation
    recommendations.push({
      id: 'REC-BOTTLENECK-1',
      type: 'bottleneck',
      priority: 'MEDIUM',
      priorityClass: 'badge-info',
      title: 'Rebalance Packing Station Labor',
      desc: 'Packing cycle time is 19.8 min (3.3x baseline). Assign David Chen to assist packaging.',
      reason: 'Labor redistribution will reduce queue dwell time from 19.8m to 7.5m.',
      actionLabel: 'Rebalance Floor Staff',
      onExecute: () => {
        store.logDecision({
          category: 'Labor Rebalancing',
          title: 'Floor Pickers Rebalanced to Packing Station',
          whatHappened: 'Assigned David Chen and Aaliyah Patel to Packing Station 2.',
          whyItHappened: 'Packing queue exceeded 15 minute threshold.',
          systemRecommendation: 'Resume normal routing when packing queue drops below 4 orders.',
          status: 'Completed'
        });
        store.addNotification({
          type: 'success',
          title: 'Labor Rebalanced',
          message: 'Staff reallocated to Packing Station 2. Throughput normalized.',
          actionUrl: 'analytics'
        });
        this.close();
      }
    });

    // Store callbacks globally for onclick
    window._copilotActions = {};

    container.innerHTML = recommendations.slice(0, 3).map(rec => {
      window._copilotActions[rec.id] = rec.onExecute;

      return `
        <div class="copilot-card">
          <div class="copilot-card-priority">
            <span class="badge ${rec.priorityClass}">${rec.priority}</span>
            <span style="color: var(--text-muted); font-size: 0.7rem;">AI Recommendation</span>
          </div>
          <div class="copilot-card-title">${rec.title}</div>
          <div class="copilot-card-desc">${rec.desc}</div>
          <div class="copilot-reason-box">
            <strong>WHY:</strong> ${rec.reason}
          </div>
          <button class="btn btn-primary btn-sm" style="margin-top: 0.25rem;" onclick="window._copilotActions['${rec.id}']()">
            ⚡ ${rec.actionLabel}
          </button>
        </div>
      `;
    }).join('');
  }
};

window.DecisionAssistant = DecisionAssistant;
