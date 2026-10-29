// Small helpers for showing orders.

/** "T2 · 3 guests" or "Take-out · Maya" */
export const orderTitle = (order) =>
    order.type === 'TABLE'
        ? `${order.table.label} · ${order.guests} ${order.guests === 1 ? 'guest' : 'guests'}`
        : `Take-out · ${order.customerName}`

/**
 * A table order's dishes grouped by seat, for the runner: Seat 1, Seat 2…
 * then Shared (dishes with no seat). A take-out is one group with no title.
 * @returns {{ key: string, title: string|null, items: object[] }[]}
 */
export function groupBySeat(order) {
    if (order.type !== 'TABLE') return [{ key: 'all', title: null, items: order.items }]
    const seats = [...new Set(order.items.map((item) => item.seat).filter((seat) => seat !== null))].sort((a, b) => a - b)
    const groups = seats.map((seat) => ({ key: `seat-${seat}`, title: `Seat ${seat}`, items: order.items.filter((item) => item.seat === seat) }))
    const shared = order.items.filter((item) => item.seat === null)
    if (shared.length > 0) groups.push({ key: 'shared', title: 'Shared', items: shared })
    return groups
}
