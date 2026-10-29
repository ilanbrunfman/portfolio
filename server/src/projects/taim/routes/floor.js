import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { idParams } from '../../../shared/schemas/common.js'
import { allow } from '../middleware/staff.js'
import { tableCreate, tableUpdate, orderCreate, orderUpdate, orderItemsAdd, orderItemUpdate, orderListQuery, orderItemParams } from '../schemas/floor.js'
import { ORDER_INCLUDE, billTotal, getOrder, requireOpenOrder, toOrderJson } from '../services/orders.js'

// The floor (tables) and orders. Everyone picked can read them; changing
// them needs a right: setUpTables, seatTable, addDishes, closeBill.
const router = Router()

/** Prisma's "unique value already used" error → 409 with a message under the Label input */
function labelTaken(err) {
    if (err.code === 'P2002') {
        throw new HttpError(409, 'There is already a table with this label', { fields: { label: 'There is already a table with this label' } })
    }
    throw err
}

// ---------- tables ----------

/**
 * A table that can take new guests: it exists (400 otherwise) and has been
 * cleaned since the last guests left (409 otherwise). Whether it's free is
 * left to the database's one-open-order-per-table index.
 */
async function requireReadyTable(tableId, db = prisma) {
    const table = await db.diningTable.findUnique({ where: { id: tableId } })
    if (!table) throw new HttpError(400, 'Validation failed', { fields: { tableId: 'Table not found' } })
    if (table.needsCleaning) throw new HttpError(409, `${table.label} needs cleaning first`)
    return table
}

/** The database's one-open-order-per-table index said no → 409 */
const tableTaken = (err) => {
    if (err.code === 'P2002') throw new HttpError(409, 'This table is already seated')
    throw err
}

/**
 * Seats: a take-out has none; at a table, seat 1…guests (null = shared).
 * A seat that doesn't fit → 400 under `field`.
 */
function checkSeat(order, seat, field) {
    if (seat === null) return
    if (order.type === 'TAKEOUT') throw new HttpError(400, 'Validation failed', { fields: { [field]: 'Take-out dishes have no seat' } })
    if (seat > order.guests) {
        throw new HttpError(400, 'Validation failed', { fields: { [field]: `Seat ${seat} doesn't exist: the table has ${order.guests} guests` } })
    }
}

// GET /api/taim/tables – every table in floor order; `order` is its open
// order (a short summary) or null; `needsCleaning` = guests left, not cleaned yet
router.get('/tables', async (req, res) => {
    const tables = await prisma.diningTable.findMany({
        orderBy: { position: 'asc' },
        include: {
            orders: {
                where: { status: 'OPEN' },
                select: { id: true, guests: true, openedAt: true, items: { select: { price: true, status: true } } },
            },
        },
    })
    res.json(
        tables.map(({ orders, ...table }) => {
            const open = orders[0] // the database allows at most one
            return {
                ...table,
                order: open
                    ? {
                          id: open.id,
                          guests: open.guests,
                          openedAt: open.openedAt,
                          dishCount: open.items.length,
                          cameBack: open.items.filter((item) => item.status === 'CAME_BACK').length,
                          total: billTotal(open.items),
                      }
                    : null,
            }
        })
    )
})

// POST /api/taim/tables { label, seats } – added at the end of the floor
router.post('/tables', allow('setUpTables'), validate({ body: tableCreate }), async (req, res) => {
    const last = await prisma.diningTable.aggregate({ _max: { position: true } })
    const table = await prisma.diningTable
        .create({ data: { ...req.valid.body, position: (last._max.position ?? 0) + 1 } })
        .catch(labelTaken)
    res.status(201).json({ ...table, order: null })
})

// PATCH /api/taim/tables/:id { label?, seats? }
router.patch('/tables/:id', allow('setUpTables'), validate({ params: idParams, body: tableUpdate }), async (req, res) => {
    const table = await prisma.diningTable.update({ where: { id: req.valid.params.id }, data: req.valid.body }).catch(labelTaken)
    res.json(table)
})

// POST /api/taim/tables/:id/clean – guests have left and the table is clean
router.post('/tables/:id/clean', allow('cleanTable'), validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params
    const table = await prisma.diningTable.findUnique({ where: { id }, include: { orders: { where: { status: 'OPEN' }, select: { id: true } } } })
    if (!table) throw new HttpError(404, 'Table not found')
    if (table.orders.length > 0) throw new HttpError(409, `${table.label} still has guests`)
    const updated = await prisma.diningTable.update({ where: { id }, data: { needsCleaning: false } })
    res.json({ ...updated, order: null })
})

// ---------- orders ----------

// GET /api/taim/orders?status=OPEN – open orders (tables and take-outs), oldest first
router.get('/orders', validate({ query: orderListQuery }), async (req, res) => {
    const orders = await prisma.order.findMany({
        where: { status: req.valid.query.status },
        include: ORDER_INCLUDE,
        orderBy: { openedAt: req.valid.query.status === 'OPEN' ? 'asc' : 'desc' },
        take: 100,
    })
    res.json(orders.map(toOrderJson))
})

// GET /api/taim/orders/:id – one order with its dishes and the bill so far
router.get('/orders/:id', validate({ params: idParams }), async (req, res) => {
    res.json(await getOrder(req.valid.params.id))
})

// POST /api/taim/orders – seat a table { type: 'TABLE', tableId, guests }
// or start a take-out { type: 'TAKEOUT', customerName }
router.post('/orders', allow('seatTable'), validate({ body: orderCreate }), async (req, res) => {
    const data = req.valid.body
    if (data.type === 'TABLE') await requireReadyTable(data.tableId)

    // No "is it free?" check first: two hosts could both pass it at the same
    // moment. The database's one-open-order-per-table index decides instead.
    const order = await prisma.order
        .create({ data: { ...data, openedById: req.staff.id }, include: ORDER_INCLUDE })
        .catch(tableTaken)
    res.status(201).json(toOrderJson(order))
})

// PATCH /api/taim/orders/:id { tableId?, guests? } – fix a seating mistake:
// move the guests to another (ready, free) table and/or change how many there are
router.patch('/orders/:id', allow('seatTable'), validate({ params: idParams, body: orderUpdate }), async (req, res) => {
    const { id } = req.valid.params
    const data = req.valid.body
    const order = await requireOpenOrder(id)
    if (order.type !== 'TABLE') throw new HttpError(409, 'Only a table order can be moved')

    if (data.guests !== undefined) {
        // Fewer guests than seats with dishes would leave dishes for nobody
        const { _max } = await prisma.orderItem.aggregate({ where: { orderId: id }, _max: { seat: true } })
        if (_max.seat && _max.seat > data.guests) {
            throw new HttpError(409, `Seat ${_max.seat} has dishes: remove them or keep ${_max.seat} guests`)
        }
    }
    if (data.tableId !== undefined && data.tableId !== order.tableId) await requireReadyTable(data.tableId)

    await prisma.order.update({ where: { id }, data }).catch(tableTaken)
    res.json(await getOrder(id))
})

// DELETE /api/taim/orders/:id – undo a seating (or a take-out) made by
// mistake. Only while nothing has been ordered: after that it's a real bill.
router.delete('/orders/:id', allow('seatTable'), validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params
    const order = await requireOpenOrder(id)
    if (order._count.items > 0) throw new HttpError(409, 'This order already has dishes: remove them first, or close the bill')
    await prisma.order.delete({ where: { id } })
    res.status(204).end()
})

// POST /api/taim/orders/:id/items { items: [{ menuItemId, quantity }] } – add dishes
router.post('/orders/:id/items', allow('addDishes'), validate({ params: idParams, body: orderItemsAdd }), async (req, res) => {
    const { id } = req.valid.params
    const { items } = req.valid.body

    const order = await prisma.$transaction(async (tx) => {
        const current = await requireOpenOrder(id, tx)

        for (const { seat } of items) checkSeat(current, seat, 'items')

        const ids = [...new Set(items.map((item) => item.menuItemId))]
        const dishes = await tx.menuItem.findMany({ where: { id: { in: ids } } })
        const byId = new Map(dishes.map((dish) => [dish.id, dish]))

        const missing = ids.find((dishId) => !byId.has(dishId))
        if (missing) throw new HttpError(400, 'Validation failed', { fields: { items: 'A dish is not on the menu' } })
        const soldOut = dishes.find((dish) => dish.hidden)
        if (soldOut) throw new HttpError(409, `${soldOut.name} is sold out`)

        // One row per dish; the price is copied now, so a later price change
        // never rewrites this bill
        await tx.orderItem.createMany({
            data: items.flatMap(({ menuItemId, quantity, seat }) =>
                Array.from({ length: quantity }, () => ({ orderId: id, menuItemId, seat, price: byId.get(menuItemId).price }))
            ),
        })
        return getOrder(id, tx)
    })
    res.status(201).json(order)
})

// PATCH /api/taim/orders/:id/items/:itemId { seat } – the dish is for
// another guest (or shared). Any time while the bill is open, whatever the
// kitchen status: it only changes who gets it.
router.patch('/orders/:id/items/:itemId', allow('addDishes'), validate({ params: orderItemParams, body: orderItemUpdate }), async (req, res) => {
    const { id, itemId } = req.valid.params
    const order = await requireOpenOrder(id)
    checkSeat(order, req.valid.body.seat, 'seat')
    const { count } = await prisma.orderItem.updateMany({ where: { id: itemId, orderId: id }, data: { seat: req.valid.body.seat } })
    if (count === 0) throw new HttpError(404, 'Dish not found on this order')
    res.json(await getOrder(id))
})

// DELETE /api/taim/orders/:id/items/:itemId – take back a dish added by
// mistake, only while the kitchen is still preparing it
router.delete('/orders/:id/items/:itemId', allow('addDishes'), validate({ params: orderItemParams }), async (req, res) => {
    const { id, itemId } = req.valid.params
    await requireOpenOrder(id)
    const item = await prisma.orderItem.findFirst({ where: { id: itemId, orderId: id } })
    if (!item) throw new HttpError(404, 'Dish not found on this order')
    if (item.status !== 'PREPARING') throw new HttpError(409, 'Only a dish that is still being prepared can be removed')
    await prisma.orderItem.delete({ where: { id: itemId } })
    res.json(await getOrder(id))
})

// POST /api/taim/orders/:id/close – close the bill. The guests leave, so the
// table is free but needs cleaning (yellow on the floor) before new guests.
router.post('/orders/:id/close', allow('closeBill'), validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params
    await prisma.$transaction(async (tx) => {
        // Only an OPEN order changes; if it was already closed nothing is updated
        const { count } = await tx.order.updateMany({ where: { id, status: 'OPEN' }, data: { status: 'CLOSED', closedAt: new Date() } })
        if (count === 0) await requireOpenOrder(id, tx) // throws the right error: 404 or 409
        const { tableId } = await tx.order.findUniqueOrThrow({ where: { id }, select: { tableId: true } })
        if (tableId) await tx.diningTable.update({ where: { id: tableId }, data: { needsCleaning: true } })
    })
    res.json(await getOrder(id))
})

export default router
