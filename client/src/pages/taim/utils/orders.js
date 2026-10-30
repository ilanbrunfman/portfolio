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
        notSent: items.filter((item) => item.status === 'NEW' && !item.held).length,
        onHold: items.filter((item) => item.held).length,
        kitchenFiredBy: cooking.find((item) => item.kitchenFired)?.firedBy ?? null,
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

/** "20:05" – the clock time of a date, in the viewer's time zone */
export const clockTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

/** "Seat 2" or "Shared" */
export const seatLabel = (seat) => (seat === null ? 'Shared' : `Seat ${seat}`)

/**
 * An order's dishes grouped the way they were ordered: Round 1, Round 2…
 * (each "Send to kitchen", oldest first, with the time it was sent), then
 * the dishes not sent yet. Inside a round, dishes are ordered by seat
 * (shared last), so the runner can still serve seat by seat.
 * @returns {{ key: string, title: string, sentAt: string|null, items: object[] }[]}
 */
export function groupByRound(order) {
    const bySeat = (a, b) => (a.seat ?? Infinity) - (b.seat ?? Infinity) || a.id - b.id
    const rounds = [...new Set(order.items.map((item) => item.round).filter((round) => round !== null))].sort((a, b) => a - b)
    const groups = rounds.map((round) => {
        const items = order.items.filter((item) => item.round === round).sort(bySeat)
        // kitchenFiredBy: the kitchen fired this round from on hold ("Avi"), not the waiter
        return { key: `round-${round}`, title: `Round ${round}`, sentAt: items[0].firedAt, kitchenFiredBy: items[0].kitchenFired ? items[0].firedBy : null, items }
    })
    const held = order.items.filter((item) => item.held).sort(bySeat)
    if (held.length > 0) groups.push({ key: 'on-hold', title: 'On hold', sentAt: null, items: held })
    const notSent = order.items.filter((item) => item.round === null && !item.held).sort(bySeat)
    if (notSent.length > 0) groups.push({ key: 'not-sent', title: 'Not sent yet', sentAt: null, items: notSent })
    return groups
}

/**
 * How a dish is doing against its prep time:
 *   'ok'   – well within it (or no prep time set)
 *   'soon' – 80% of the time used
 *   'late' – past it
 */
export const timing = (elapsed, prepMinutes) => {
    if (!prepMinutes) return 'ok'
    if (elapsed > prepMinutes) return 'late'
    return elapsed >= prepMinutes * 0.8 ? 'soon' : 'ok'
}

/** Why a guest gave a dish back: the API's values with their labels, in menu order */
export const RETURN_REASONS = [
    { value: 'COLD', label: 'Cold' },
    { value: 'WRONG_DISH', label: 'Wrong dish' },
    { value: 'TASTE', label: 'Taste' },
    { value: 'UNDERCOOKED', label: 'Undercooked' },
    { value: 'ALLERGY', label: 'Allergy / something in it' },
    { value: 'TOO_SLOW', label: 'Too slow' },
    { value: 'OTHER', label: 'Other' },
]

/** 'COLD' → 'Cold' */
export const reasonLabel = (value) => RETURN_REASONS.find((reason) => reason.value === value)?.label ?? value
