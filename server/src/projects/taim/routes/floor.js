import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { idParams } from '../../../shared/schemas/common.js'
import { allow } from '../middleware/staff.js'
import { tableCreate, tableUpdate, orderCreate, orderItemsAdd, orderListQuery, orderItemParams } from '../schemas/floor.js'
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

// GET /api/taim/tables – every table in floor order; `order` is its open
// order (a short summary) or null when the table is free
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
    if (data.type === 'TABLE') {
        const table = await prisma.diningTable.findUnique({ where: { id: data.tableId } })
        if (!table) throw new HttpError(400, 'Validation failed', { fields: { tableId: 'Table not found' } })
    }

    // No "is it free?" check first: two hosts could both pass it at the same
    // moment. The database's one-open-order-per-table index decides instead.
    const order = await prisma.order
        .create({ data: { ...data, openedById: req.staff.id }, include: ORDER_INCLUDE })
        .catch((err) => {
            if (err.code === 'P2002') throw new HttpError(409, 'This table is already seated')
            throw err
        })
    res.status(201).json(toOrderJson(order))
})

// POST /api/taim/orders/:id/items { items: [{ menuItemId, quantity }] } – add dishes
router.post('/orders/:id/items', allow('addDishes'), validate({ params: idParams, body: orderItemsAdd }), async (req, res) => {
    const { id } = req.valid.params
    const { items } = req.valid.body

    const order = await prisma.$transaction(async (tx) => {
        await requireOpenOrder(id, tx)
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
            data: items.flatMap(({ menuItemId, quantity }) =>
                Array.from({ length: quantity }, () => ({ orderId: id, menuItemId, price: byId.get(menuItemId).price }))
            ),
        })
        return getOrder(id, tx)
    })
    res.status(201).json(order)
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

// POST /api/taim/orders/:id/close – close the bill; a table becomes free
router.post('/orders/:id/close', allow('closeBill'), validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params
    // Only an OPEN order changes; if it was already closed nothing is updated
    const { count } = await prisma.order.updateMany({ where: { id, status: 'OPEN' }, data: { status: 'CLOSED', closedAt: new Date() } })
    if (count === 0) await requireOpenOrder(id) // throws the right error: 404 or 409
    res.json(await getOrder(id))
})

export default router
