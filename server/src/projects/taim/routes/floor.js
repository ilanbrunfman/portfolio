import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { idParams } from '../../../shared/schemas/common.js'
import { allow, allowDishChanges } from '../middleware/staff.js'
import { tableCreate, tableUpdate, tablesCombine, orderCreate, orderUpdate, orderItemsAdd, orderItemUpdate, orderSend, orderListQuery, orderItemParams, cameBack, waste } from '../schemas/floor.js'
import { ORDER_INCLUDE, billTotal, getOrder, requireOpenOrder, toOrderJson } from '../services/orders.js'

// The floor (tables) and orders. Everyone picked can read them; changing
// them needs a right: setUpTables, seatTable, cleanTable, combineTables,
// closeBill, and for an order's dishes addDishes (tables) or takeoutOrders
// (take-outs).
//
// Combined tables: the other tables of a group point to its main table
// (joinedToId). The main table takes the group's orders – so the
// one-open-order-per-table rule still holds – and the group is seated,
// cleaned and closed as one.
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
    const table = await db.diningTable.findUnique({ where: { id: tableId }, include: { joinedTo: { select: { label: true } } } })
    if (!table) throw new HttpError(400, 'Validation failed', { fields: { tableId: 'Table not found' } })
    if (table.joinedTo) throw new HttpError(409, `${table.label} is combined with ${table.joinedTo.label}: seat ${table.joinedTo.label} instead`)
    if (table.needsCleaning) throw new HttpError(409, `${table.label} needs cleaning first`)
    return table
}

/**
 * A table's group: its main table (itself, or the one it's joined to) with
 * every table joined to it, in floor order, and the main table's open order
 * if any. 404 if the table doesn't exist.
 */
async function groupOf(tableId, db = prisma) {
    const table = await db.diningTable.findUnique({ where: { id: tableId }, select: { joinedToId: true } })
    if (!table) throw new HttpError(404, 'Table not found')
    const main = await db.diningTable.findUniqueOrThrow({
        where: { id: table.joinedToId ?? tableId },
        include: {
            joined: { orderBy: { position: 'asc' } },
            orders: { where: { status: 'OPEN' }, select: { id: true } },
        },
    })
    const { joined, orders, ...mainTable } = main
    return { main: mainTable, members: [mainTable, ...joined], openOrder: orders[0] ?? null }
}

/** "T1 + T4 + T7" */
const groupLabel = (members) => members.map((t) => t.label).join(' + ')

/**
 * No more guests than seats: a single table's own seats, or the total of
 * combined tables (T1 + T4 + T7 = 10). Too many → 400 under "guests".
 */
async function checkGuestsFit(tableId, guests, db = prisma) {
    const { members } = await groupOf(tableId, db)
    const seats = members.reduce((sum, t) => sum + t.seats, 0)
    if (guests > seats) {
        throw new HttpError(400, 'Validation failed', {
            fields: { guests: `${groupLabel(members)} has ${seats} seats: seat up to ${seats} guests` },
        })
    }
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
// order (a short summary) or null; `needsCleaning` = guests left, not cleaned yet.
// The summary says how the food is coming along: dishes not sent yet,
// dishes on hold (mains waiting for "Fire"), dishes in the kitchen, since when the oldest is waiting, and for which
// seats (null = shared) – so a waiter can ask the kitchen about them.
router.get('/tables', async (req, res) => {
    const tables = await prisma.diningTable.findMany({
        orderBy: { position: 'asc' },
        include: {
            joined: { select: { id: true, label: true, seats: true }, orderBy: { position: 'asc' } },
            orders: {
                where: { status: 'OPEN' },
                select: { id: true, guests: true, openedAt: true, items: { select: { price: true, status: true, remakeOfId: true, held: true, toGo: true, kitchenFired: true, firedBy: { select: { name: true } }, seat: true, firedAt: true } } },
            },
        },
    })
    res.json(
        tables.map(({ orders, joined, ...table }) => {
            const open = orders[0] // the database allows at most one
            const cooking = open ? open.items.filter((item) => item.status === 'PREPARING') : []
            return {
                ...table,
                // A main table of combined tables: the others, and the group's label and seats
                joined,
                groupLabel: groupLabel([table, ...joined]),
                groupSeats: table.seats + joined.reduce((sum, t) => sum + t.seats, 0),
                order: open
                    ? {
                          id: open.id,
                          guests: open.guests,
                          openedAt: open.openedAt,
                          dishCount: open.items.filter((item) => item.status !== 'WASTED').length,
                          notSent: open.items.filter((item) => item.status === 'NEW' && !item.held).length,
                          onHold: open.items.filter((item) => item.held).length,
                          inKitchen: cooking.length,
                          // the oldest dish still in the kitchen: since when it waits
                          waitingSince: cooking.reduce((oldest, item) => (!oldest || item.firedAt < oldest ? item.firedAt : oldest), null),
                          // seats still waiting for food, in order; null = shared, last
                          waitingSeats: [...new Set(cooking.map((item) => item.seat))].sort((a, b) => (a ?? Infinity) - (b ?? Infinity)),
                          cameBack: open.items.filter((item) => item.status === 'CAME_BACK').length,
                          // to-go dishes still in the kitchen: wait before bringing the bill
                          toGoInKitchen: cooking.filter((item) => item.toGo).length,
                          // the kitchen fired held dishes that are cooking now: who did ("Avi"), or null
                          kitchenFiredBy: cooking.find((item) => item.kitchenFired)?.firedBy?.name ?? null,
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

/**
 * Set the cleaning flag of a table – of its whole group, if it's combined.
 * Cleaning a group after its party also splits it back into single tables.
 * 404 if it doesn't exist, 409 while the group has guests.
 */
async function setNeedsCleaning(id, needsCleaning) {
    return prisma.$transaction(async (tx) => {
        const { main, members, openOrder } = await groupOf(id, tx)
        if (openOrder) throw new HttpError(409, `${groupLabel(members)} still has guests`)
        const ids = members.map((t) => t.id)
        await tx.diningTable.updateMany({ where: { id: { in: ids } }, data: { needsCleaning } })
        if (!needsCleaning && members.length > 1) {
            await tx.diningTable.updateMany({ where: { joinedToId: main.id }, data: { joinedToId: null } })
        }
        return { ...main, needsCleaning, order: null }
    })
}

// POST /api/taim/tables/:id/clean – guests have left and the table is
// clean (combined tables: the whole group, which then splits up)
router.post('/tables/:id/clean', allow('cleanTable'), validate({ params: idParams }), async (req, res) => {
    res.json(await setNeedsCleaning(req.valid.params.id, false))
})

// POST /api/taim/tables/combine { tableIds } – two or more free, clean,
// single tables become one group for a big party. The first one on the
// floor becomes the main table; the group's seats are added up.
router.post('/tables/combine', allow('combineTables'), validate({ body: tablesCombine }), async (req, res) => {
    const { tableIds } = req.valid.body
    const main = await prisma.$transaction(async (tx) => {
        const tables = await tx.diningTable.findMany({
            where: { id: { in: tableIds } },
            orderBy: { position: 'asc' },
            include: { joined: { select: { id: true } }, orders: { where: { status: 'OPEN' }, select: { id: true } } },
        })
        if (tables.length !== tableIds.length) throw new HttpError(400, 'Validation failed', { fields: { tableIds: 'A table was not found' } })
        for (const table of tables) {
            if (table.orders.length > 0) throw new HttpError(409, `${table.label} has guests: only free tables can be combined`)
            if (table.needsCleaning) throw new HttpError(409, `${table.label} needs cleaning first`)
            if (table.joinedToId || table.joined.length > 0) throw new HttpError(409, `${table.label} is already combined`)
        }
        const [first, ...others] = tables
        await tx.diningTable.updateMany({ where: { id: { in: others.map((t) => t.id) } }, data: { joinedToId: first.id } })
        return first
    })
    res.status(201).json(await groupJson(main.id))
})

// POST /api/taim/tables/:id/split – combined tables back to single tables
// (any table of the group); only while nobody is seated there
router.post('/tables/:id/split', allow('combineTables'), validate({ params: idParams }), async (req, res) => {
    const main = await prisma.$transaction(async (tx) => {
        const { main, members, openOrder } = await groupOf(req.valid.params.id, tx)
        if (members.length === 1) throw new HttpError(409, `${main.label} isn't combined`)
        if (openOrder) throw new HttpError(409, `${groupLabel(members)} has guests: split it after they leave`)
        await tx.diningTable.updateMany({ where: { joinedToId: main.id }, data: { joinedToId: null } })
        return main
    })
    res.json(await groupJson(main.id))
})

/** A main table with its group's label and seats (as in GET /tables, without the order) */
async function groupJson(mainId) {
    const { members } = await groupOf(mainId)
    const [main, ...joined] = members
    return {
        ...main,
        joined: joined.map(({ id, label, seats }) => ({ id, label, seats })),
        groupLabel: groupLabel(members),
        groupSeats: members.reduce((sum, t) => sum + t.seats, 0),
        order: null,
    }
}

// POST /api/taim/tables/:id/needs-cleaning – a "ready" table isn't clean
// enough after all: back to yellow, so someone comes back to it
router.post('/tables/:id/needs-cleaning', allow('cleanTable'), validate({ params: idParams }), async (req, res) => {
    res.json(await setNeedsCleaning(req.valid.params.id, true))
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
        await requireReadyTable(data.tableId)
        await checkGuestsFit(data.tableId, data.guests)
    }

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
    // The guests (new or current count) must fit the table (new or current)
    await checkGuestsFit(data.tableId ?? order.tableId, data.guests ?? order.guests)

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
router.post('/orders/:id/items', validate({ params: idParams, body: orderItemsAdd }), allowDishChanges, async (req, res) => {
    const { id } = req.valid.params
    const { items } = req.valid.body

    const order = await prisma.$transaction(async (tx) => {
        const current = await requireOpenOrder(id, tx)

        for (const { seat } of items) checkSeat(current, seat, 'items')
        if (current.type === 'TAKEOUT' && items.some((item) => item.toGo)) {
            throw new HttpError(400, 'Validation failed', { fields: { items: 'A take-out is to go already' } })
        }

        const ids = [...new Set(items.map((item) => item.menuItemId))]
        const dishes = await tx.menuItem.findMany({ where: { id: { in: ids } } })
        const byId = new Map(dishes.map((dish) => [dish.id, dish]))

        const missing = ids.find((dishId) => !byId.has(dishId))
        if (missing) throw new HttpError(400, 'Validation failed', { fields: { items: 'A dish is not on the menu' } })
        const soldOut = dishes.find((dish) => dish.hidden)
        if (soldOut) throw new HttpError(409, `${soldOut.name} is sold out`)

        // One row per dish; the price is copied now, so a later price change
        // never rewrites this bill. NEW = on the bill, not sent to the kitchen yet.
        await tx.orderItem.createMany({
            data: items.flatMap(({ menuItemId, quantity, seat, toGo }) =>
                Array.from({ length: quantity }, () => ({ orderId: id, menuItemId, seat, toGo, price: byId.get(menuItemId).price, status: 'NEW' }))
            ),
        })
        return getOrder(id, tx)
    })
    res.status(201).json(order)
})

// PATCH /api/taim/orders/:id/items/:itemId { seat?, toGo? } – the dish is
// for another guest (or shared), or to take home (or not). Any time while
// the bill is open, whatever the kitchen status: it only changes who gets it
// and how (plated or packed).
router.patch('/orders/:id/items/:itemId', validate({ params: orderItemParams, body: orderItemUpdate }), allowDishChanges, async (req, res) => {
    const { id, itemId } = req.valid.params
    const { seat, toGo } = req.valid.body
    const order = await requireOpenOrder(id)
    if (seat !== undefined) checkSeat(order, seat, 'seat')
    if (toGo && order.type === 'TAKEOUT') throw new HttpError(400, 'Validation failed', { fields: { toGo: 'A take-out is to go already' } })
    const { count } = await prisma.orderItem.updateMany({ where: { id: itemId, orderId: id }, data: { seat, toGo } })
    if (count === 0) throw new HttpError(404, 'Dish not found on this order')
    res.json(await getOrder(id))
})

// POST /api/taim/orders/:id/send { itemIds? } – send dishes to the kitchen
// (NEW → PREPARING) as the order's next round (1 = first send, e.g.
// starters; 2 = the mains 20 minutes later…).
//   no itemIds: every dish not sent yet, held ones too
//   itemIds:    only those (dishes not sent yet on this order); the other
//               dishes not sent yet are put on hold – "starters now, mains
//               later". Sending the held ones later is "Fire".
router.post('/orders/:id/send', validate({ params: idParams, body: orderSend }), allowDishChanges, async (req, res) => {
    const { id } = req.valid.params
    const { itemIds } = req.valid.body
    await prisma.$transaction(async (tx) => {
        await requireOpenOrder(id, tx)
        const waiting = await tx.orderItem.findMany({ where: { orderId: id, status: 'NEW' }, select: { id: true } })
        if (waiting.length === 0) throw new HttpError(409, 'Nothing new to send: add dishes first')
        const toSend = itemIds ? [...new Set(itemIds)] : waiting.map((item) => item.id)
        const waitingIds = new Set(waiting.map((item) => item.id))
        if (toSend.some((itemId) => !waitingIds.has(itemId))) {
            throw new HttpError(409, 'A dish was already sent or removed: refresh the order and try again')
        }

        const { _max } = await tx.orderItem.aggregate({ where: { orderId: id }, _max: { round: true } })
        await tx.orderItem.updateMany({
            where: { id: { in: toSend }, status: 'NEW' },
            data: { status: 'PREPARING', firedAt: new Date(), round: (_max.round ?? 0) + 1, held: false, firedById: req.staff.id },
        })
        // Whatever wasn't sent waits for "Fire"
        await tx.orderItem.updateMany({ where: { orderId: id, status: 'NEW' }, data: { held: true } })
    })
    res.json(await getOrder(id))
})

// POST /api/taim/orders/:id/hold { itemIds? } – put dishes not sent yet on
// hold without sending anything: the starters went earlier and the mains
// should wait. No itemIds = every dish not sent yet. The kitchen sees them
// under "Coming up"; "Fire" (send) sends them later.
router.post('/orders/:id/hold', validate({ params: idParams, body: orderSend }), allowDishChanges, async (req, res) => {
    const { id } = req.valid.params
    const { itemIds } = req.valid.body
    await prisma.$transaction(async (tx) => {
        await requireOpenOrder(id, tx)
        const waiting = await tx.orderItem.findMany({ where: { orderId: id, status: 'NEW', held: false }, select: { id: true } })
        if (waiting.length === 0) throw new HttpError(409, 'Nothing to hold: add dishes first')
        const waitingIds = new Set(waiting.map((item) => item.id))
        const toHold = itemIds ? [...new Set(itemIds)] : [...waitingIds]
        if (toHold.some((itemId) => !waitingIds.has(itemId))) {
            throw new HttpError(409, 'A dish was already sent, held or removed: refresh the order and try again')
        }
        await tx.orderItem.updateMany({ where: { id: { in: toHold }, status: 'NEW' }, data: { held: true } })
    })
    res.json(await getOrder(id))
})

/**
 * Add a dish to an order for the same seat (and to go or not) as `item`:
 * straight to the kitchen as the next round (sendNow) or waiting on the
 * bill as not sent. remakeOfId set = free, given instead of `item`.
 */
async function addDishLike(tx, { orderId, item, menuItemId, price, sendNow, staffId, remakeOfId = null }) {
    const sent = sendNow ? { status: 'PREPARING', firedAt: new Date(), firedById: staffId, round: await nextRound(tx, orderId) } : { status: 'NEW' }
    return tx.orderItem.create({ data: { orderId, menuItemId, price, seat: item.seat, toGo: item.toGo, remakeOfId, ...sent } })
}

/** The order's next "Send to kitchen" round number */
async function nextRound(tx, orderId) {
    const { _max } = await tx.orderItem.aggregate({ where: { orderId }, _max: { round: true } })
    return (_max.round ?? 0) + 1
}

// POST /api/taim/orders/:id/items/:itemId/came-back
//   { reason, note?, fix?, remake?, replaceWithId?, sendNow? }
// (markCameBack: Manager, Chef, Waiter) – the guest sent a served dish back.
//   fix: the kitchen fixes the same plate (cook it more, more spice). It
//        goes straight back to the kitchen as the next round, marked as a
//        fix with the reason and note; it stays on the bill (the guest eats
//        it) and costs nothing, but the fix is recorded.
// Otherwise the guest gave it back:
// It leaves the bill and counts as a loss, with the reason, note and who
// recorded it. What the guest gets instead is on the house – free on the
// bill, its price a loss too:
//   remake        the same dish again (same seat, to go or not)
//   replaceWithId another dish: the right one, something else, or a
//                 dessert on us
// sendNow (default): straight to the kitchen as the next round, so the
// guest doesn't wait for a Send; false: it waits on the bill as not sent
// (the dessert comes later). Only a served dish on an open bill; a sold-out
// dish can't be given (choose something else).
router.post('/orders/:id/items/:itemId/came-back', allow('markCameBack'), validate({ params: orderItemParams, body: cameBack }), async (req, res) => {
    const { id, itemId } = req.valid.params
    const { reason, note, fix, remake, replaceWithId, sendNow } = req.valid.body
    await prisma.$transaction(async (tx) => {
        await requireOpenOrder(id, tx)
        const item = await tx.orderItem.findFirst({ where: { id: itemId, orderId: id }, include: { menuItem: { select: { name: true, hidden: true } } } })
        if (!item) throw new HttpError(404, 'Dish not found on this order')

        if (fix) {
            // Back in the kitchen as a new round: sent now, not started, not served
            const { count } = await tx.orderItem.updateMany({
                where: { id: itemId, status: 'SENT_OUT' },
                data: { status: 'PREPARING', round: await nextRound(tx, id), firedAt: new Date(), firedById: req.staff.id, startedAt: null, startedById: null, sentOutAt: null, servedById: null },
            })
            if (count === 0) throw new HttpError(409, 'Only a served dish can come back')
            await tx.itemReturn.create({ data: { orderItemId: itemId, kind: 'FIX', reason, note, staffId: req.staff.id } })
            return
        }

        // What the guest gets instead, if anything
        let instead = null
        if (remake) instead = { ...item.menuItem, id: item.menuItemId, price: item.price }
        if (replaceWithId) {
            instead = await tx.menuItem.findUnique({ where: { id: replaceWithId }, select: { id: true, name: true, hidden: true, price: true } })
            if (!instead) throw new HttpError(400, 'Validation failed', { fields: { replaceWithId: 'That dish is not on the menu' } })
        }
        if (instead?.hidden) throw new HttpError(409, `${instead.name} is sold out: choose something else from the menu`)

        // Only from SENT_OUT, in one UPDATE: two taps can't both succeed
        const { count } = await tx.orderItem.updateMany({ where: { id: itemId, status: 'SENT_OUT' }, data: { status: 'CAME_BACK' } })
        if (count === 0) throw new HttpError(409, 'Only a served dish can come back')
        await tx.itemReturn.create({ data: { orderItemId: itemId, kind: 'RETURN', reason, note, staffId: req.staff.id } })

        if (instead) {
            await addDishLike(tx, { orderId: id, item, menuItemId: instead.id, price: instead.price, sendNow, staffId: req.staff.id, remakeOfId: itemId })
        }
    })
    res.status(201).json(await getOrder(id))
})

// POST /api/taim/orders/:id/items/:itemId/waste { reason, note?, remake? }
// (addDishes / takeoutOrders) – food lost without a guest giving it back:
//   CANCELLED  the guest cancelled a dish the kitchen already started
//              (one it hasn't started is just removed: nothing was cooked)
//   DROPPED    a served dish never reached the guest; remake: made again
//              and charged as usual (the guest pays once), straight to the
//              kitchen
// The dish stays on the order as WASTED: not on the bill, a loss.
router.post('/orders/:id/items/:itemId/waste', validate({ params: orderItemParams, body: waste }), allowDishChanges, async (req, res) => {
    const { id, itemId } = req.valid.params
    const { reason, note, remake } = req.valid.body
    await prisma.$transaction(async (tx) => {
        await requireOpenOrder(id, tx)
        const item = await tx.orderItem.findFirst({ where: { id: itemId, orderId: id }, include: { menuItem: { select: { name: true, hidden: true } } } })
        if (!item) throw new HttpError(404, 'Dish not found on this order')

        const from = reason === 'CANCELLED' ? { status: 'PREPARING', startedAt: { not: null } } : { status: 'SENT_OUT' }
        if (reason === 'DROPPED' && remake && item.menuItem.hidden) throw new HttpError(409, `${item.menuItem.name} is sold out: choose something else from the menu`)
        const { count } = await tx.orderItem.updateMany({ where: { id: itemId, ...from }, data: { status: 'WASTED' } })
        if (count === 0) {
            if (reason === 'CANCELLED' && item.status === 'PREPARING') throw new HttpError(409, "The kitchen hasn't started it: just remove it")
            throw new HttpError(409, reason === 'CANCELLED' ? 'Only a dish the kitchen is cooking can be cancelled as waste' : 'Only a served dish can be dropped')
        }
        await tx.itemReturn.create({ data: { orderItemId: itemId, kind: 'WASTE', reason, note, staffId: req.staff.id } })

        if (reason === 'DROPPED' && remake) {
            await addDishLike(tx, { orderId: id, item, menuItemId: item.menuItemId, price: item.price, sendNow: true, staffId: req.staff.id })
        }
    })
    res.status(201).json(await getOrder(id))
})

// DELETE /api/taim/orders/:id/items/:itemId/came-back (markCameBack) – marked
// by mistake: the dish is back on the bill as served. Its remake goes too if
// the kitchen hasn't served it yet; once served, it stays (409).
router.delete('/orders/:id/items/:itemId/came-back', allow('markCameBack'), validate({ params: orderItemParams }), async (req, res) => {
    const { id, itemId } = req.valid.params
    await prisma.$transaction(async (tx) => {
        await requireOpenOrder(id, tx)
        const item = await tx.orderItem.findFirst({ where: { id: itemId, orderId: id }, include: { remake: { select: { id: true, status: true } } } })
        if (!item) throw new HttpError(404, 'Dish not found on this order')
        if (item.status !== 'CAME_BACK') throw new HttpError(409, "This dish didn't come back")
        if (item.remake) {
            if (item.remake.status !== 'NEW' && item.remake.status !== 'PREPARING') {
                throw new HttpError(409, 'Its remake was already served, so the return stays')
            }
            await tx.orderItem.delete({ where: { id: item.remake.id } })
        }
        await tx.itemReturn.deleteMany({ where: { orderItemId: itemId, kind: 'RETURN' } })
        await tx.orderItem.update({ where: { id: itemId }, data: { status: 'SENT_OUT' } })
    })
    res.json(await getOrder(id))
})

// DELETE /api/taim/orders/:id/items/:itemId – take back a dish: any time
// before it's sent to the kitchen, or while the kitchen is preparing it
router.delete('/orders/:id/items/:itemId', validate({ params: orderItemParams }), allowDishChanges, async (req, res) => {
    const { id, itemId } = req.valid.params
    await requireOpenOrder(id)
    const item = await prisma.orderItem.findFirst({ where: { id: itemId, orderId: id } })
    if (!item) throw new HttpError(404, 'Dish not found on this order')
    if (item.status !== 'NEW' && item.status !== 'PREPARING') {
        throw new HttpError(409, 'The kitchen already sent this dish out, so it stays on the bill')
    }
    await prisma.orderItem.delete({ where: { id: itemId } })
    res.json(await getOrder(id))
})

// POST /api/taim/orders/:id/close – close the bill. The guests leave, so the
// table is free but needs cleaning (yellow on the floor) before new guests.
router.post('/orders/:id/close', allow('closeBill'), validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params
    await prisma.$transaction(async (tx) => {
        // Guests don't pay for dishes the kitchen never got, or hasn't served yet
        const held = await tx.orderItem.count({ where: { orderId: id, held: true } })
        if (held > 0) {
            throw new HttpError(409, `${held} ${held === 1 ? 'dish is' : 'dishes are'} on hold: fire or remove ${held === 1 ? 'it' : 'them'} first`)
        }
        const notSent = await tx.orderItem.count({ where: { orderId: id, status: 'NEW' } })
        if (notSent > 0) {
            throw new HttpError(409, `${notSent} ${notSent === 1 ? "dish hasn't" : "dishes haven't"} been sent to the kitchen: send or remove ${notSent === 1 ? 'it' : 'them'} first`)
        }
        const cooking = await tx.orderItem.count({ where: { orderId: id, status: 'PREPARING' } })
        if (cooking > 0) {
            throw new HttpError(409, `${cooking} ${cooking === 1 ? 'dish is' : 'dishes are'} still in the kitchen: close the bill once everything is served`)
        }
        // Only an OPEN order changes; if it was already closed nothing is updated
        const { count } = await tx.order.updateMany({ where: { id, status: 'OPEN' }, data: { status: 'CLOSED', closedAt: new Date() } })
        if (count === 0) await requireOpenOrder(id, tx) // throws the right error: 404 or 409
        // The table – or the whole group of combined tables – needs cleaning
        const { tableId } = await tx.order.findUniqueOrThrow({ where: { id }, select: { tableId: true } })
        if (tableId) await tx.diningTable.updateMany({ where: { OR: [{ id: tableId }, { joinedToId: tableId }] }, data: { needsCleaning: true } })
    })
    res.json(await getOrder(id))
})

export default router
