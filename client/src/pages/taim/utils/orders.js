// Small helpers for showing orders.

/** "T2 · 3 guests" or "Take-out · Maya" */
export const orderTitle = (order) =>
    order.type === 'TABLE'
        ? `${order.table.label} · ${order.guests} ${order.guests === 1 ? 'guest' : 'guests'}`
        : `Take-out · ${order.customerName}`
