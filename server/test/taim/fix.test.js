import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'

// Step 6: a steak sent back undercooked, or "not enough spices" – the kitchen
// fixes the same plate. Still charged, no money lost, but recorded.
let waiter, cook, manager, table, steak, hummus

beforeEach(async () => {
    await resetTaim()
    ;[waiter, cook, manager] = await Promise.all(['WAITER', 'COOK', 'MANAGER'].map(as))
    table = await prisma.diningTable.create({ data: { label: 'T5', seats: 4, position: 1 } })
    const category = await prisma.menuCategory.create({ data: { name: 'Mains', position: 1 } })
    ;[steak, hummus] = await Promise.all([
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Steak', price: 3200, position: 1, prepMinutes: 15 } }),
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Hummus', price: 900, position: 2 } }),
    ])
})

/** T5: a steak for seat 1, served → { order, dish } */
async function steakServed() {
    const order = (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests: 2 }).expect(201)).body
    await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: steak.id, seat: 1 }] }).expect(201)
    const sent = (await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)).body
    await cook.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(204)
    await cook.post(`/api/taim/order-items/${sent.items[0].id}/serve`).expect(204)
    return { order, dish: sent.items[0] }
}
const fix = (order, dish, body = {}) =>
    waiter.post(`/api/taim/orders/${order.id}/items/${dish.id}/came-back`).send({ reason: 'UNDERCOOKED', note: 'medium, not rare', fix: true, ...body })
const losses = async () => (await manager.get(`/api/taim/losses?from=${new Date(Date.now() - 86_400_000).toISOString()}&to=${new Date(Date.now() + 60_000).toISOString()}`).expect(200)).body

describe('fix it: the same plate back to the kitchen', () => {
    it('goes back as the next round, first in line, marked as a fix; still charged', async () => {
        const { order, dish } = await steakServed()
        // another table's ticket, sent before the fix
        await prisma.diningTable.create({ data: { label: 'T6', seats: 2, position: 2 } })
        const other = (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: 2, guests: 1 }).expect(201)).body
        await waiter.post(`/api/taim/orders/${other.id}/items`).send({ items: [{ menuItemId: hummus.id, seat: 1 }] }).expect(201)
        await waiter.post(`/api/taim/orders/${other.id}/send`).expect(200)

        const res = (await fix(order, dish).expect(201)).body
        expect(res.items).toHaveLength(1) // no new dish
        expect(res.items[0]).toMatchObject({ status: 'PREPARING', round: 2, startedAt: null, sentOutAt: null, servedBy: null, returned: null })
        expect(res.items[0].fixes).toMatchObject([{ kind: 'FIX', reason: 'UNDERCOOKED', note: 'medium, not rare', by: 'Lior' }])
        expect(res.total).toBe(3200)

        const kitchen = (await cook.get('/api/taim/kitchen').expect(200)).body
        expect(kitchen.tickets.map((t) => [t.title, t.fix])).toEqual([['T5', true], ['T6', false]])
        expect(kitchen.tickets[0]).toMatchObject({ round: 2, startedAt: null })
        expect(kitchen.tickets[0].dishes[0].fix).toEqual({ reason: 'UNDERCOOKED', note: 'medium, not rare' })
        expect(kitchen.cameBack[0]).toMatchObject({ name: 'Steak', fix: true, reason: 'UNDERCOOKED' })
    })

    it('costs nothing but is counted in Losses', async () => {
        const { order, dish } = await steakServed()
        await fix(order, dish).expect(201)
        expect(await losses()).toMatchObject({ total: 0, fixes: 1, count: 1 })
        expect((await losses()).returns[0]).toMatchObject({ kind: 'FIX', value: 0, remakePrice: null })
    })

    it('fixed, served again, then it can still come back (and be fixed again)', async () => {
        const { order, dish } = await steakServed()
        await fix(order, dish).expect(201)
        await cook.post(`/api/taim/order-items/${dish.id}/serve`).expect(204)
        await fix(order, dish, { reason: 'TASTE', note: 'more salt' }).expect(201)
        await cook.post(`/api/taim/order-items/${dish.id}/serve`).expect(204)
        const res = (await waiter.post(`/api/taim/orders/${order.id}/items/${dish.id}/came-back`).send({ reason: 'UNDERCOOKED' }).expect(201)).body
        expect(res.items[0]).toMatchObject({ status: 'CAME_BACK', returned: { kind: 'RETURN' } })
        expect(res.items[0].fixes).toHaveLength(2)
        expect(res.total).toBe(0)
        expect(await losses()).toMatchObject({ total: 3200, fixes: 2, count: 3 })
    })

    it('only a served dish; not together with remake or another dish', async () => {
        const { order, dish } = await steakServed()
        await fix(order, dish).expect(201)
        expect((await fix(order, dish).expect(409)).body.error).toBe('Only a served dish can come back') // being fixed
        const { items } = (await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: hummus.id }] }).expect(201)).body
        expect((await fix(order, items.at(-1), { remake: true }).expect(400)).body.fields._).toBe('Pick one: fix it, make it again or another dish')
    })

    it('the database keeps a dish lost at most once (fixes can repeat)', async () => {
        const { dish } = await steakServed()
        const staffId = (await prisma.staff.findFirstOrThrow()).id
        await prisma.itemReturn.create({ data: { orderItemId: dish.id, kind: 'FIX', reason: 'TASTE', staffId } })
        await prisma.itemReturn.create({ data: { orderItemId: dish.id, kind: 'FIX', reason: 'TASTE', staffId } })
        await prisma.itemReturn.create({ data: { orderItemId: dish.id, kind: 'RETURN', reason: 'COLD', staffId } })
        await expect(prisma.itemReturn.create({ data: { orderItemId: dish.id, kind: 'RETURN', reason: 'COLD', staffId } })).rejects.toThrow()
    })
})
