// Small helpers for showing orders.

/** "T2 · 3 guests" or "Take-out · Maya" */
export const orderTitle = (order) =>
    order.type === 'TABLE'
        ? `${order.table.label} · ${order.guests} ${order.guests === 1 ? 'guest' : 'guests'}`
        : `Take-out · ${order.customerName}`

/**
 * Seats still waiting for food, short enough for a table card:
 * [1] → "seat 1", [1, 3] → "seats 1, 3", [2, null] → "seat 2 + shared",
 * [null] → "shared" (null = shared)
 */
export function seatsText(seats) {
    const numbers = seats.filter((seat) => seat !== null)
    const shared = numbers.length < seats.length
    const text = numbers.length === 0 ? '' : `${numbers.length === 1 ? 'seat' : 'seats'} ${numbers.join(', ')}`
    return [text, shared && 'shared'].filter(Boolean).join(' + ')
}

/**
 * How an order's food is coming along, from its dishes (the same numbers
 * the floor summary gives for tables): not sent, in the kitchen, since when
 * the oldest waits, and which seats still wait.
 */
export function kitchenProgress(items) {
    const cooking = items.filter((item) => item.status === 'PREPARING')
    return {
        notSent: items.filter((item) => item.status === 'NEW').length,
        inKitchen: cooking.length,
        waitingSince: cooking.reduce((oldest, item) => (!oldest || item.firedAt < oldest ? item.firedAt : oldest), null),
        waitingSeats: [...new Set(cooking.map((item) => item.seat))].sort((a, b) => (a ?? Infinity) - (b ?? Infinity)),
    }
}

/**
 * The seats a dish can be for: Seat 1…N and Shared at a table, none for a
 * take-out. Values are strings for RadioGroup: '1', '2', … 'shared'.
 * @returns {{ value: string, label: string }[]}
 */
export const seatOptions = (order) =>
    order.type === 'TABLE'
        ? [
              ...Array.from({ length: order.guests }, (_, i) => ({ value: String(i + 1), label: `Seat ${i + 1}` })),
              { value: 'shared', label: 'Shared' },
          ]
        : []

/** RadioGroup value ↔ API seat: 'shared' ↔ null, '2' ↔ 2 */
export const seatFromValue = (value) => (value === 'shared' || value === null ? null : Number(value))
export const valueFromSeat = (seat) => (seat === null ? 'shared' : String(seat))

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
