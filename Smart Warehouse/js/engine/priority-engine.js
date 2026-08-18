/**
 * SmartWarehouse AI - Priority Engine
 * Computes multi-factor priority scores with complete explainability metrics.
 * 
 * Formula:
 * PriorityScore = w1 * SLA_Urgency + w2 * Customer_Tier + w3 * Order_Value + w4 * Shortage_Risk
 * Scaled to 0 - 100.
 */

const PriorityEngine = {
  // Weights (Sum = 1.0)
  WEIGHTS: {
    slaUrgency: 0.40,     // 40% weight on deadline urgency
    customerTier: 0.25,   // 25% weight on VIP / Enterprise status
    orderValue: 0.20,     // 20% weight on total dollar value
    backorderRisk: 0.15   // 15% weight on items with low inventory risk
  },

  /**
   * Evaluates an order and returns an explainable priority object.
   */
  computePriority(order, inventoryList = []) {
    if (order.manualOverride) {
      return {
        score: order.priorityScore,
        tier: this.getScoreTier(order.priorityScore),
        factors: {
          sla: { score: 100, label: 'Manual Manager Override' },
          tier: { score: 100, label: 'Enforced High Priority' },
          value: { score: 100, label: 'Manager Directive' },
          risk: { score: 100, label: 'Direct Priority' }
        },
        reason: order.overrideReason ? `Manual Override: "${order.overrideReason}"` : 'Manual Override by Warehouse Manager',
        isManual: true
      };
    }

    // 1. SLA Urgency Factor (0 - 100)
    // Assume deadline timestamp compared to simulated current time (or hours remaining)
    const deadlineHoursRemaining = this.getEstimatedHoursToDeadline(order.deadline);
    let slaScore = 20;
    let slaLabel = 'Normal SLA Window (> 8 hrs)';

    if (deadlineHoursRemaining <= 2.0) {
      slaScore = 100;
      slaLabel = `🚨 Critical: SLA breach in ${deadlineHoursRemaining.toFixed(1)} hrs!`;
    } else if (deadlineHoursRemaining <= 4.0) {
      slaScore = 80;
      slaLabel = `⚠️ Tight SLA: ${deadlineHoursRemaining.toFixed(1)} hrs remaining`;
    } else if (deadlineHoursRemaining <= 6.0) {
      slaScore = 60;
      slaLabel = `Standard SLA: ${deadlineHoursRemaining.toFixed(1)} hrs remaining`;
    } else if (deadlineHoursRemaining <= 8.0) {
      slaScore = 40;
      slaLabel = `Comfortable SLA: ${deadlineHoursRemaining.toFixed(1)} hrs remaining`;
    }

    // 2. Customer Tier Factor (0 - 100)
    let tierScore = 30;
    let tierLabel = 'Standard Customer';
    const tierLower = (order.customerTier || '').toLowerCase();

    if (tierLower.includes('vip') || tierLower.includes('enterprise')) {
      tierScore = 100;
      tierLabel = '💎 VIP Enterprise Tier (Max Contract SLA)';
    } else if (tierLower.includes('partner') || tierLower.includes('regular partner')) {
      tierScore = 70;
      tierLabel = '🤝 Regular B2B Partner';
    } else if (tierLower.includes('gold') || tierLower.includes('priority')) {
      tierScore = 85;
      tierLabel = '🥇 Gold Tier Account';
    }

    // 3. Order Dollar Value Factor (0 - 100)
    const val = order.totalValue || 0;
    let valueScore = 20;
    let valueLabel = `Low Value ($${val.toFixed(2)})`;

    if (val >= 2500) {
      valueScore = 100;
      valueLabel = `High Commercial Value ($${val.toLocaleString('en-US', { minimumFractionDigits: 2 })})`;
    } else if (val >= 1000) {
      valueScore = 75;
      valueLabel = `Medium-High Value ($${val.toLocaleString('en-US', { minimumFractionDigits: 2 })})`;
    } else if (val >= 500) {
      valueScore = 50;
      valueLabel = `Standard Basket ($${val.toLocaleString('en-US', { minimumFractionDigits: 2 })})`;
    }

    // 4. Backorder / Stock Scarcity Risk (0 - 100)
    let riskScore = 20;
    let riskLabel = 'Stock Available in Primary Bins';
    if (order.items && inventoryList.length > 0) {
      const hasTightStock = order.items.some(item => {
        const product = inventoryList.find(p => p.sku === item.sku);
        return product && product.available <= product.reorderThreshold;
      });
      if (hasTightStock) {
        riskScore = 80;
        riskLabel = '⚠️ High Stockout Risk on 1+ Line Items (Allocate Fast)';
      }
    }

    // Weighted Formula
    const rawScore = (
      this.WEIGHTS.slaUrgency * slaScore +
      this.WEIGHTS.customerTier * tierScore +
      this.WEIGHTS.orderValue * valueScore +
      this.WEIGHTS.backorderRisk * riskScore
    );

    const finalScore = Math.round(Math.min(100, Math.max(1, rawScore)));

    // Generate human-friendly explanation reason
    const explanationParts = [];
    if (slaScore >= 80) explanationParts.push(slaLabel);
    if (tierScore >= 70) explanationParts.push(tierLabel);
    if (valueScore >= 75) explanationParts.push(valueLabel);
    if (explanationParts.length === 0) explanationParts.push('Standard priority processing queue');

    return {
      score: finalScore,
      tier: this.getScoreTier(finalScore),
      factors: {
        sla: { score: slaScore, label: slaLabel, weight: '40%' },
        tier: { score: tierScore, label: tierLabel, weight: '25%' },
        value: { score: valueScore, label: valueLabel, weight: '20%' },
        risk: { score: riskScore, label: riskLabel, weight: '15%' }
      },
      reason: explanationParts.join(' • '),
      isManual: false
    };
  },

  getEstimatedHoursToDeadline(deadlineStr) {
    if (!deadlineStr) return 8.0;
    try {
      // Mock simulation: assume current time is 2026-08-18 11:30
      const deadlineDate = new Date(deadlineStr.replace(' ', 'T'));
      const simNow = new Date('2026-08-18T11:30:00');
      const diffMs = deadlineDate - simNow;
      const diffHrs = diffMs / (1000 * 60 * 60);
      return diffHrs > 0 ? diffHrs : 0.5;
    } catch (e) {
      return 4.0;
    }
  },

  getScoreTier(score) {
    if (score >= 90) return { label: 'CRITICAL', color: 'var(--status-critical)', class: 'badge-critical' };
    if (score >= 75) return { label: 'HIGH', color: 'var(--status-warning)', class: 'badge-warning' };
    if (score >= 50) return { label: 'MEDIUM', color: 'var(--status-info)', class: 'badge-info' };
    return { label: 'LOW', color: 'var(--status-neutral)', class: 'badge-neutral' };
  }
};

window.PriorityEngine = PriorityEngine;
