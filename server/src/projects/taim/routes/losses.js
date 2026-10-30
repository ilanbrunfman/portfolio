import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { allow } from '../middleware/staff.js'
import { lossesQuery } from '../schemas/losses.js'
import { TITLE_SELECT, titleOf } from '../services/orders.js'

// Losses (seeLosses: Manager, Chef): what lost dishes cost – returns (a
// guest gave it back) and waste (cancelled after the kitchen started it,
// dropped, made wrong). A return's value is the dish's price plus the free
// dish given instead, if any; waste is the dish's price. Calculated from
// the rows, never stored.
const router = Router()

/** Group returns by a key → [{ key, count, value }], biggest loss first */
function groupBy(returns, keyOf) {
    const groups = new Map()
    for (const row of returns) {
        const key = keyOf(row)
        const group = groups.get(key) ?? { count: 0, value: 0 }
        group.count += 1
        group.value += row.value
        groups.set(key, group)
    }
    return [...groups].map(([key, group]) => ({ key, ...group })).sort((a, b) => b.value - a.value || b.count - a.count)
}

// GET /api/taim/losses?from=<ISO>&to=<ISO>
//   total (returnsTotal + wasteTotal), count, remakes: money lost, lost dishes,
//            how many returns got a free dish instead
//   byReason: [{ reason, count, value }]   byDish: [{ name, count, value }]
//   returns: every one, newest first: dish, table, seat, reason, note, who,
//            when, price, remakePrice (or null) and value
router.get('/losses', allow('seeLosses'), validate({ query: lossesQuery }), async (req, res) => {
    const { from, to } = req.valid.query
    const rows = await prisma.itemReturn.findMany({
        where: { createdAt: { gte: from, lt: to } },
        select: {
            kind: true,
            reason: true,
            note: true,
            createdAt: true,
            staff: { select: { name: true } },
            orderItem: {
                select: {
                    id: true,
                    price: true,
                    seat: true,
                    menuItem: { select: { name: true } },
                    order: { select: { id: true, ...TITLE_SELECT } },
                    remake: { select: { price: true, menuItem: { select: { name: true } } } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    const returns = rows.map(({ orderItem: dish, ...row }) => {
        const remakePrice = dish.remake?.price ?? null
        return {
            id: dish.id,
            orderId: dish.order.id,
            kind: row.kind,
            at: row.createdAt,
            name: dish.menuItem.name,
            title: titleOf(dish.order),
            seat: dish.seat,
            reason: row.reason,
            note: row.note,
            by: row.staff.name,
            price: dish.price,
            remakePrice,
            // what was given instead: the same dish (null = same) or another one
            remakeName: dish.remake && dish.remake.menuItem.name !== dish.menuItem.name ? dish.remake.menuItem.name : null,
            value: dish.price + (remakePrice ?? 0),
        }
    })

    res.json({
        total: returns.reduce((sum, row) => sum + row.value, 0),
        returnsTotal: returns.filter((row) => row.kind === 'RETURN').reduce((sum, row) => sum + row.value, 0),
        wasteTotal: returns.filter((row) => row.kind === 'WASTE').reduce((sum, row) => sum + row.value, 0),
        count: returns.length,
        remakes: returns.filter((row) => row.remakePrice !== null).length,
        byReason: groupBy(returns, (row) => row.reason).map(({ key, ...group }) => ({ reason: key, ...group })),
        byDish: groupBy(returns, (row) => row.name).map(({ key, ...group }) => ({ name: key, ...group })),
        returns,
    })
})

export default router
