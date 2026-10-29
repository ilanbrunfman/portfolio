import { prisma } from '../../../shared/db.js'
import { HttpError } from '../../../shared/lib/httpError.js'

// What every order response includes from the database
export const ORDER_INCLUDE = {
    table: { select: { id: true, label: true } },
    openedBy: { select: { id: true, name: true } },
    items: {
        select: { id: true, menuItemId: true, price: true, status: true, createdAt: true, sentOutAt: true, menuItem: { select: { name: true } } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    },
}

/**
 * The bill: every dish except the ones that came back (those count as a
 * loss instead, step 6). Calculated, never stored, like the bank's balances.
 */
export const billTotal = (items) => items.filter((item) => item.status !== 'CAME_BACK').reduce((sum, item) => sum + item.price, 0)

/** Database row (with ORDER_INCLUDE) → the JSON the client gets */
export function toOrderJson(order) {
    return {
        id: order.id,
        type: order.type,
        status: order.status,
        table: order.table,
        guests: order.guests,
        customerName: order.customerName,
        openedBy: order.openedBy,
        openedAt: order.openedAt,
        closedAt: order.closedAt,
        items: order.items.map(({ menuItem, ...item }) => ({ ...item, name: menuItem.name })),
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
    const order = await db.order.findUnique({ where: { id }, select: { id: true, status: true } })
    if (!order) throw new HttpError(404, 'Order not found')
    if (order.status !== 'OPEN') throw new HttpError(409, 'This bill is already closed')
    return order
}
