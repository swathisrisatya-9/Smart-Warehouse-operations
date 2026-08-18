/**
 * SmartWarehouse AI - Inventory Allocation Engine
 * The intelligent rules-based core that manages inventory reservations, scarcity resolution,
 * priority fulfillment, and plain-English explainability logs.
 */

const AllocationEngine = {
  /**
   * Runs the full automated allocation simulation across all pending orders and inventory.
   * Returns a simulation outcome report with decision logs, shortfalls, and resolution options.
   */
  simulateAllocation(ordersList, productsList) {
    // Clone datasets to prevent direct premature mutation during simulation
    const products = JSON.parse(JSON.stringify(productsList));
    const orders = JSON.parse(JSON.stringify(ordersList));

    // Sort pending orders by priority score descending
    const pendingOrders = orders
      .filter(o => ['Pending Allocation', 'Allocated', 'Stock Conflict (Delayed)', 'Exception'].includes(o.status))
      .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    // Available virtual inventory tracker
    const inventoryPool = {};
    products.forEach(p => {
      inventoryPool[p.sku] = {
        total: p.quantity,
        allocated: 0,
        available: p.quantity, // simulation starts from fresh unreserved stock
        productRef: p
      };
    });

    const decisionLogs = [];
    const allocationResults = [];

    // Allocate step-by-step
    pendingOrders.forEach((order, index) => {
      let isFullyAllocated = true;
      let hasPartialItem = false;
      const orderShortfalls = [];

      const allocatedItems = order.items.map(item => {
        const pool = inventoryPool[item.sku];
        const requested = item.requestedQty || 1;

        if (!pool) {
          isFullyAllocated = false;
          orderShortfalls.push({
            sku: item.sku,
            name: item.name,
            requested: requested,
            allocated: 0,
            shortage: requested,
            reason: 'SKU not found in warehouse master inventory catalog'
          });
          return { ...item, allocatedQty: 0, fulfilled: false };
        }

        if (pool.available >= requested) {
          // Full stock available for this line item
          pool.available -= requested;
          pool.allocated += requested;
          return { ...item, allocatedQty: requested, fulfilled: true };
        } else if (pool.available > 0) {
          // Partial stock available
          const given = pool.available;
          const shortage = requested - given;
          pool.allocated += given;
          pool.available = 0;
          hasPartialItem = true;
          isFullyAllocated = false;

          orderShortfalls.push({
            sku: item.sku,
            name: item.name,
            requested: requested,
            allocated: given,
            shortage: shortage,
            reason: `Requested ${requested} units, but only ${given} remained in ${item.binLocation || pool.productRef.binLocation}.`
          });

          return { ...item, allocatedQty: given, fulfilled: false };
        } else {
          // Zero available stock
          isFullyAllocated = false;
          orderShortfalls.push({
            sku: item.sku,
            name: item.name,
            requested: requested,
            allocated: 0,
            shortage: requested,
            reason: `Stock completely depleted by higher-priority orders in queue.`
          });

          return { ...item, allocatedQty: 0, fulfilled: false };
        }
      });

      // Determine order outcome status & explainability
      let outcomeStatus = 'Fully Allocated';
      let outcomeDetail = {};

      if (isFullyAllocated) {
        outcomeStatus = 'Fully Allocated';
        decisionLogs.push({
          orderId: order.id,
          priorityRank: `#${index + 1} (Score: ${order.priorityScore})`,
          customer: order.customer,
          what: `100% stock reserved (${order.items.reduce((s, i) => s + i.requestedQty, 0)} total units).`,
          why: `Order has priority score ${order.priorityScore} and inventory was sufficient in primary bin locations.`,
          recommendation: 'Release directly to Wave Picking.'
        });
      } else if (hasPartialItem) {
        outcomeStatus = 'Partial Allocation';
        const primaryShortage = orderShortfalls[0];
        const product = products.find(p => p.sku === primaryShortage.sku);

        outcomeDetail = {
          shortfallSku: primaryShortage.sku,
          missingUnits: primaryShortage.shortage,
          reason: `Partial fulfillment on ${primaryShortage.name}: ${primaryShortage.allocated}/${primaryShortage.requested} allocated. Priority rank #${index + 1} secured available stock.`,
          resolutionOptions: [
            { type: 'split_shipment', label: `Split Ship ${primaryShortage.allocated} units now, backorder ${primaryShortage.shortage} units` },
            { 
              type: 'substitute_sku', 
              label: product && product.substituteSKU ? `Substitute with ${product.substituteSKU} (${this.getProductName(product.substituteSKU, products)})` : 'Substitute with Alternative Model'
            },
            { type: 'backorder', label: 'Hold full shipment until Inbound PO arrives' }
          ]
        };

        decisionLogs.push({
          orderId: order.id,
          priorityRank: `#${index + 1} (Score: ${order.priorityScore})`,
          customer: order.customer,
          what: `Partial allocation: Secured ${primaryShortage.allocated} of ${primaryShortage.requested} units for ${primaryShortage.name}.`,
          why: `Physical stock was constrained. Allocated remaining on-hand units to this order based on high Priority Score (${order.priorityScore}).`,
          recommendation: `Execute split shipment or substitute ${product?.substituteSKU || 'alternative SKU'}.`
        });
      } else {
        outcomeStatus = 'Stock Conflict (Delayed)';
        const primaryShortage = orderShortfalls[0];
        outcomeDetail = {
          shortfallSku: primaryShortage.sku,
          missingUnits: primaryShortage.shortage,
          reason: `Order delayed. Zero stock available for ${primaryShortage.name} because higher priority orders claimed all units.`,
          resolutionOptions: [
            { type: 'backorder', label: 'Queue for arrival of Inbound Replenishment PO' },
            { type: 'split_shipment', label: 'Dispatch other fulfilled line items first' },
            { type: 'notify_delay', label: 'Notify customer of SLA revision' }
          ]
        };

        decisionLogs.push({
          orderId: order.id,
          priorityRank: `#${index + 1} (Score: ${order.priorityScore})`,
          customer: order.customer,
          what: `Allocation paused due to stockout on ${primaryShortage.name}.`,
          why: `Priority Score (${order.priorityScore}) ranked behind other active orders that consumed available inventory.`,
          recommendation: 'Fast-track Inbound PO receiving dock check-in.'
        });
      }

      allocationResults.push({
        orderId: order.id,
        customer: order.customer,
        customerTier: order.customerTier,
        priorityScore: order.priorityScore,
        status: outcomeStatus,
        items: allocatedItems,
        shortfalls: orderShortfalls,
        details: outcomeDetail
      });
    });

    return {
      results: allocationResults,
      inventorySummary: inventoryPool,
      decisionLogs: decisionLogs
    };
  },

  getProductName(sku, products) {
    const p = products.find(prod => prod.sku === sku);
    return p ? p.name : sku;
  },

  /**
   * Applies a one-click substitute SKU resolution to an order in state store.
   */
  applySubstituteSKU(orderId, oldSku, newSku) {
    const store = window.stateStore;
    const order = store.getOrderById(orderId);
    const newProduct = store.getProductBySku(newSku);
    const oldProduct = store.getProductBySku(oldSku);

    if (!order || !newProduct) return false;

    // Replace the item in the order
    const itemIndex = order.items.findIndex(i => i.sku === oldSku);
    if (itemIndex >= 0) {
      const oldQty = order.items[itemIndex].requestedQty;
      order.items[itemIndex] = {
        sku: newProduct.sku,
        name: newProduct.name,
        requestedQty: oldQty,
        allocatedQty: oldQty,
        fulfilled: true,
        binLocation: newProduct.binLocation,
        unitPrice: newProduct.unitPrice,
        isSubstitute: true,
        originalSku: oldSku
      };

      order.status = 'Allocated';
      order.allocationStatus = 'Substitute Applied (Fulfilled)';
      order.priorityReason = `🔄 SKU Substitute Applied: Replaced ${oldSku} with ${newSku} (${newProduct.name})`;

      // Adjust new product reservation
      store.updateProductStock(newSku, -oldQty, `Substitute Allocation for ${orderId}`, 'Allocation Engine');

      store.logDecision({
        category: 'Scarcity Resolution: Substitute SKU',
        title: `Substituted ${oldSku} with ${newSku} for ${orderId}`,
        whatHappened: `Replaced out-of-stock ${oldProduct ? oldProduct.name : oldSku} with in-stock alternative ${newProduct.name} (${newSku}).`,
        whyItHappened: `Order ${orderId} was stalled on zero stock. Alternative SKU ${newSku} has ${newProduct.available} available units in ${newProduct.binLocation}.`,
        systemRecommendation: 'Release order to Picking immediately.',
        status: 'Completed'
      });

      store.addNotification({
        type: 'success',
        title: 'Substitute SKU Applied',
        message: `Order ${orderId} successfully updated with ${newProduct.name}.`,
        actionUrl: 'orders',
        targetId: orderId
      });

      store.saveState();
      store.emit('allocation:resolved', { orderId, type: 'substitute_sku', oldSku, newSku });
      return true;
    }
    return false;
  },

  /**
   * Applies Split Shipment resolution: ships currently allocated units and creates a backorder record.
   */
  applySplitShipment(orderId) {
    const store = window.stateStore;
    const order = store.getOrderById(orderId);
    if (!order) return false;

    order.status = 'Picking';
    order.allocationStatus = 'Split Shipment (Active Wave)';
    order.priorityReason = `⚡ Split Shipment Authorized: Dispatching partial stock now, remainder backordered.`;

    store.logDecision({
      category: 'Scarcity Resolution: Split Shipment',
      title: `Split shipment executed for ${orderId}`,
      whatHappened: `Order ${orderId} partitioned: In-stock items routed to Picking, backorder item linked to incoming replenishment.`,
      whyItHappened: `Customer is ${order.customerTier} and deadline is within critical SLA threshold. Partial delivery satisfies urgent requirements.`,
      systemRecommendation: 'Generate packing slip indicating partial shipment to avoid customer confusion.',
      status: 'Completed'
    });

    store.addNotification({
      type: 'info',
      title: 'Split Shipment Released',
      message: `Order ${orderId} released to Picking for partial fulfillment.`,
      actionUrl: 'pick-pack',
      targetId: orderId
    });

    store.saveState();
    store.emit('allocation:resolved', { orderId, type: 'split_shipment' });
    return true;
  },

  /**
   * Applies Backorder resolution: holds order until replenishment arrives.
   */
  applyBackorder(orderId) {
    const store = window.stateStore;
    const order = store.getOrderById(orderId);
    if (!order) return false;

    order.status = 'Pending Allocation';
    order.allocationStatus = 'Backordered (Awaiting Inbound PO)';
    order.priorityReason = `⏳ Backordered: Awaiting inbound supplier replenishment.`;

    store.logDecision({
      category: 'Scarcity Resolution: Backorder Hold',
      title: `Backorder hold applied for ${orderId}`,
      whatHappened: `Order put on hold pending receipt of inbound shipment.`,
      whyItHappened: `Customer opted to wait for full shipment rather than receive partial deliveries or substitute items.`,
      systemRecommendation: 'Tag order for priority cross-dock when PO arrives at receiving dock.',
      status: 'Completed'
    });

    store.saveState();
    store.emit('allocation:resolved', { orderId, type: 'backorder' });
    return true;
  }
};

window.AllocationEngine = AllocationEngine;
