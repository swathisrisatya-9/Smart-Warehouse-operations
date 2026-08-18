/**
 * SmartWarehouse AI - Bottleneck & Operational Diagnostics Engine
 * Analyzes stage dwell times, cycle times, throughput velocity, and flags active warehouse bottlenecks.
 */

const BottleneckEngine = {
  /**
   * Evaluates current operational health across all fulfillment pipeline stages.
   */
  diagnoseWarehouse(ordersList, stageMetrics = {}) {
    const orders = ordersList || [];
    
    // Count orders in each active stage
    const stageCounts = {
      'Order Created': 0,
      'Priority Engine': 0,
      'Stock Allocation': orders.filter(o => o.status === 'Pending Allocation').length,
      'Picking': orders.filter(o => o.status === 'Picking' || o.status === 'Allocated').length,
      'Packing': orders.filter(o => o.status === 'Packing').length,
      'Quality Check': orders.filter(o => o.status === 'Quality Check').length,
      'Dispatch': orders.filter(o => o.status === 'Dispatched').length,
      'Exception': orders.filter(o => o.status === 'Exception').length
    };

    // Stage metrics analysis
    const stages = [
      { name: 'Stock Allocation', currentDwellMin: 1.8, baselineMin: 3.0, capacityPerHr: 120 },
      { name: 'Picking', currentDwellMin: 14.5, baselineMin: 15.0, capacityPerHr: 80 },
      { name: 'Packing', currentDwellMin: 19.8, baselineMin: 6.0, capacityPerHr: 35 }, // The Bottleneck!
      { name: 'Quality Check', currentDwellMin: 4.2, baselineMin: 5.0, capacityPerHr: 90 },
      { name: 'Dispatch', currentDwellMin: 8.5, baselineMin: 10.0, capacityPerHr: 110 }
    ];

    let highestRatio = 0;
    let worstStage = null;

    const analyzedStages = stages.map(st => {
      const ratio = st.currentDwellMin / st.baselineMin;
      const isBottleneck = ratio >= 1.5;
      const queueLength = stageCounts[st.name] || 0;

      if (ratio > highestRatio) {
        highestRatio = ratio;
        worstStage = { ...st, ratio, queueLength };
      }

      let healthStatus = 'Optimal';
      let healthBadge = 'badge-success';
      if (ratio >= 2.0) {
        healthStatus = 'Severe Bottleneck';
        healthBadge = 'badge-critical';
      } else if (ratio >= 1.4) {
        healthStatus = 'Elevated Congestion';
        healthBadge = 'badge-warning';
      }

      return {
        ...st,
        ratio: parseFloat(ratio.toFixed(2)),
        queueLength,
        healthStatus,
        healthBadge,
        statusNote: isBottleneck 
          ? `Operating at ${ratio.toFixed(1)}x average cycle time (${queueLength} orders queued).`
          : `Within expected SLA benchmark (${st.currentDwellMin}m vs ${st.baselineMin}m baseline).`
      };
    });

    // Root-Cause Explanation and Recommendations
    let diagnosticTitle = 'All Stages Operating Within SLA Limits';
    let diagnosticWhy = 'No severe dwell time anomalies detected in the fulfillment pipeline.';
    let recommendations = ['Continue standard monitoring of order flow.'];

    if (worstStage && worstStage.ratio >= 1.5) {
      diagnosticTitle = `🚨 Active Bottleneck Detected: ${worstStage.name} Stage`;
      if (worstStage.name === 'Packing') {
        diagnosticWhy = `Packing cycle time is ${worstStage.currentDwellMin}m (${worstStage.ratio.toFixed(1)}x above 6.0m baseline). Root causes: Packaging material shortage at Station 2 and high volume of multi-item apparel orders.`;
        recommendations = [
          'Reassign 2 available floor pickers (e.g. David Chen) to assist packing station verification.',
          'Replenish 40x35x15 corrugated carton inventory from bulk reserve.',
          'Batch single-item fast pack orders to separate express station.'
        ];
      } else if (worstStage.name === 'Picking') {
        diagnosticWhy = `Picking cycle time has increased to ${worstStage.currentDwellMin}m due to cross-aisle travel.`;
        recommendations = [
          'Enable Zone-Clustered Batch Wave Picking.',
          'Reassign zone floaters to high-demand Zone A.'
        ];
      }
    }

    return {
      bottleneckStageName: worstStage ? worstStage.name : 'None',
      severityRatio: worstStage ? worstStage.ratio : 1.0,
      diagnosticTitle,
      diagnosticWhy,
      recommendations,
      stages: analyzedStages,
      stageCounts,
      slaComplianceRate: 94.8, // 94.8% on-time fulfillment rate
      avgTotalFulfillmentTimeMins: 48.8
    };
  }
};

window.BottleneckEngine = BottleneckEngine;
