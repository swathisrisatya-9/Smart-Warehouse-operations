/**
 * SmartWarehouse AI - Reorder & Demand Velocity Engine
 * Calculates dynamic run-rate, predicted stockout dates, safety stock buffer, and Economic Order Quantities.
 */

const ReorderEngine = {
  /**
   * Evaluates product stock and returns a predictive stockout and reorder analysis.
   */
  analyzeProduct(product) {
    const dailyVelocity = product.dailyDemandVelocity || 5.0; // units / day
    const available = product.available;
    const totalQty = product.quantity;
    const leadTime = product.leadTimeDays || 3; // days to deliver from supplier
    const threshold = product.reorderThreshold;

    // Days of inventory remaining
    const daysRemaining = dailyVelocity > 0 ? (available / dailyVelocity) : 999;
    const isOutOfStock = available === 0;
    const isCritical = available > 0 && daysRemaining <= leadTime;
    const isLow = !isCritical && available <= threshold;
    const isHealthy = !isOutOfStock && !isCritical && !isLow;

    // Calculate predicted stockout date
    const now = new Date();
    const stockoutDate = new Date();
    stockoutDate.setDate(now.getDate() + Math.floor(daysRemaining));
    const stockoutFormatted = isOutOfStock
      ? 'CURRENTLY OUT OF STOCK'
      : stockoutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Dynamic Recommended Reorder Quantity (EOQ + Lead Time Demand + Safety Buffer)
    // Formula: Suggested Qty = (Daily Velocity * Lead Time * 2) + Safety Stock Buffer (min 20)
    const dynamicSuggestedQty = Math.max(
      product.reorderQtySuggestion || 30,
      Math.ceil(dailyVelocity * (leadTime + 7))
    );

    // Explainable Recommendation
    let statusLabel = 'Healthy';
    let statusBadgeClass = 'badge-success';
    let urgencyReason = 'Stock level is healthy. Inventory coverage exceeds safety threshold.';
    let actionNeeded = false;

    if (isOutOfStock) {
      statusLabel = 'Out of Stock';
      statusBadgeClass = 'badge-critical';
      urgencyReason = `🚨 Immediate action required: 0 available units. Pending orders are currently blocked.`;
      actionNeeded = true;
    } else if (isCritical) {
      statusLabel = 'Critical Stockout Risk';
      statusBadgeClass = 'badge-critical';
      urgencyReason = `⚠️ Stockout in ${daysRemaining.toFixed(1)} days (< ${leadTime}-day supplier lead time). Reorder immediately to avoid outage.`;
      actionNeeded = true;
    } else if (isLow) {
      statusLabel = 'Low Stock';
      statusBadgeClass = 'badge-warning';
      urgencyReason = `Stock is below safety buffer (${available} units remaining vs ${threshold} threshold). Reorder within 48 hours.`;
      actionNeeded = true;
    }

    return {
      sku: product.sku,
      name: product.name,
      category: product.category,
      available: available,
      totalQty: totalQty,
      reserved: product.reserved,
      dailyVelocity: dailyVelocity,
      leadTimeDays: leadTime,
      daysRemaining: parseFloat(daysRemaining.toFixed(1)),
      stockoutDateFormatted: stockoutFormatted,
      suggestedReorderQty: dynamicSuggestedQty,
      supplier: product.supplier,
      unitPrice: product.unitPrice,
      estimatedPOCost: (dynamicSuggestedQty * product.unitPrice).toFixed(2),
      statusLabel: statusLabel,
      statusBadgeClass: statusBadgeClass,
      urgencyReason: urgencyReason,
      actionNeeded: actionNeeded
    };
  },

  /**
   * Scans entire catalog and returns prioritized list of items requiring reorder.
   */
  getReorderRecommendations(productsList) {
    return productsList
      .map(p => this.analyzeProduct(p))
      .filter(analysis => analysis.actionNeeded)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  },

  /**
   * Generates a Purchase Order (PO) and replenishes stock in state store.
   */
  executePOReplenishment(sku, quantity, supplierName) {
    const store = window.stateStore;
    const product = store.getProductBySku(sku);
    if (!product) return null;

    const poNumber = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
    const addedQty = parseInt(quantity, 10) || product.reorderQtySuggestion || 50;

    // Simulate inbound receipt
    store.updateProductStock(sku, addedQty, `Inbound PO Receipt (${poNumber})`, 'Receiving Dock');

    store.logDecision({
      category: 'Inventory Replenishment',
      title: `Purchase Order ${poNumber} processed for ${product.name}`,
      whatHappened: `Inbound shipment received: +${addedQty} units added to ${product.binLocation}.`,
      whyItHappened: `System triggered velocity-based replenishment to restore stock above threshold.`,
      systemRecommendation: 'Re-run allocation engine to fulfill any pending backorders.',
      status: 'Completed'
    });

    store.addNotification({
      type: 'success',
      title: `Stock Replenished: ${poNumber}`,
      message: `Received ${addedQty}x ${product.name}. Available stock is now ${product.available}.`,
      actionUrl: 'inventory',
      targetId: sku
    });

    return {
      poNumber,
      sku,
      productName: product.name,
      quantityAdded: addedQty,
      newAvailable: product.available
    };
  }
};

window.ReorderEngine = ReorderEngine;
