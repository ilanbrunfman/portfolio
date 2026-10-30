import { prisma } from '../../../shared/db.js'
import { HttpError } from '../../../shared/lib/httpError.js'

// What every order response includes from the database
export const ORDER_INCLUDE = {
    // For combined tables, the others of the group too (for the label)
    table: { select: { id: true, label: true, joined: { select: { label: true }, orderBy: { position: 'asc' } } } },
    openedBy: { select: { id: true, name: true } },
    items: {
        select: { id: true, menuItemId: true, price: true, seat: true, status: true, createdAt: true, firedAt: true, round: true, held: true, toGo: true, kitchenFired: true, firedBy: { select: { name: true } }, startedAt: true, startedBy: { select: { name: true } }, sentOutAt: true, servedBy: { select: { name: true } }, remakeOfId: true, returns: { select: { kind: true, reason: true, note: true, createdAt: true, staff: { select: { name: true } } }, orderBy: { createdAt: 'asc' } }, menuItem: { select: { name: true, category: { select: { name: true } } } } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    },
}

// What an order's title needs: "T5", "T1 + T4 + T7" or "Take-out · Maya"
export const TITLE_SELECT = {
    type: true,
    customerName: true,
    table: { select: { label: true, joined: { select: { label: true }, orderBy: { position: 'asc' } } } },
}

/** "T5", "T1 + T4 + T7" (combined tables) or "Take-out · Maya" */
export const titleOf = (order) =>
    order.type === 'TABLE' ? [order.table, ...order.table.joined].map((t) => t.label).join(' + ') : `Take-out · ${order.customerName}`

/** A dish the guest doesn't pay for: it came back or was wasted, or it's free for one that came back */
const onTheHouse = (item) => item.status === 'CAME_BACK' || item.status === 'WASTED' || item.remakeOfId != null

/**
 * The bill: every dish except the ones that came back and their free
 * remakes (those count as a loss instead, step 6). Items need status,
 * price and remakeOfId. Calculated, never stored, like the bank's balances.
 */
export const billTotal = (items) => items.filter((item) => !onTheHouse(item)).reduce((sum, item) => sum + item.price, 0)

/** Money lost: dishes that came back or were wasted, plus the free dishes given instead (each counted once) */
export const lossTotal = (items) => items.filter(onTheHouse).reduce((sum, item) => sum + item.price, 0)

/** An item_returns row → { kind, reason, note, by, at } (null stays null) */
const lossRecord = (row) => (row ? { kind: row.kind, reason: row.reason, note: row.note, by: row.staff.name, at: row.createdAt } : null)

/** Database row (with ORDER_INCLUDE) → the JSON the client gets */
export function toOrderJson(order) {
    return {
        id: order.id,
        type: order.type,
        status: order.status,
        // "T1", or "T1 + T4 + T7" for combined tables
        table: order.table && { id: order.table.id, label: [order.table, ...order.table.joined].map((t) => t.label).join(' + ') },
        guests: order.guests,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        openedBy: order.openedBy,
        openedAt: order.openedAt,
        closedAt: order.closedAt,
        // `category` lets the waiter hold a whole course ("Hold Mains")
        // `firedBy` = who sent it ("Avi"); kitchenFired = the kitchen fired it from on hold
        // startedBy / servedBy: who in the kitchen started and served it
        // returned: why it came back ({ reason, note, by, at }), or null; remakeOfId: a free remake
        items: order.items.map(({ menuItem, firedBy, startedBy, servedBy, returns, ...item }) => ({
            ...item,
            // returned: why it came back or was wasted ({ kind: RETURN | WASTE, reason, note, by, at }), or null
            returned: lossRecord(returns.find((row) => row.kind !== 'FIX')),
            // fixes: each time it was sent back to be fixed (cook it more, more spice), oldest first
            fixes: returns.filter((row) => row.kind === 'FIX').map(lossRecord),
            firedBy: firedBy?.name ?? null,
            startedBy: startedBy?.name ?? null,
            servedBy: servedBy?.name ?? null,
            name: menuItem.name,
            category: menuItem.category.name,
        })),
        total: billTotal(order.items),
    }
}

/** One order as JSON, or 404 */
export async function getOrder(id, db = prisma) {
    const order = await db.order.findUnique({ where: { id }, include: ORDER_INCLUDE })
    if (!order) throw new HttpError(404, 'Order not found')
    return toOrderJson(order)
}

/** The order if it's still open; 404 if missing, 409 if the bill is closed */
export async function requireOpenOrder(id, db = prisma) {
    const order = await db.order.findUnique({
        where: { id },
        select: { id: true, status: true, type: true, tableId: true, guests: true, _count: { select: { items: true } } },
    })
    if (!order) throw new HttpError(404, 'Order not found')
    if (order.status !== 'OPEN') throw new HttpError(409, 'This bill is already closed')
    return order
}
