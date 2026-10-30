import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'

// The Losses screen's data: what dishes that came back cost (remakes too)
let waiter, cook, manager, table, shakshuka, hummus

beforeEach(async () => {
    await resetTaim()
    ;[waiter, cook, manager] = await Promise.all(['WAITER', 'COOK', 'MANAGER'].map(as))
    table = await prisma.diningTable.create({ data: { label: 'T5', seats: 4, position: 1 } })
    const category = await prisma.menuCategory.create({ data: { name: 'Mains', position: 1 } })
    ;[shakshuka, hummus] = await Promise.all([
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Shakshuka', price: 1400, position: 1 } }),
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Hummus', price: 900, position: 2 } }),
    ])
})

/** T5 with two shakshukas and a hummus served; the shakshukas come back (one remade), the hummus too */
async function returns() {
    const order = (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests: 2 }).expect(201)).body
    await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: shakshuka.id, seat: 1, quantity: 2 }, { menuItemId: hummus.id, seat: 2 }] }).expect(201)
    const sent = (await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)).body
    for (const item of sent.items) await cook.post(`/api/taim/order-items/${item.id}/serve`).expect(204)
    const [s1, s2, h] = sent.items
    await waiter.post(`/api/taim/orders/${order.id}/items/${s1.id}/came-back`).send({ reason: 'COLD', remake: true }).expect(201)
    await waiter.post(`/api/taim/orders/${order.id}/items/${s2.id}/came-back`).send({ reason: 'COLD', note: 'second one too' }).expect(201)
    await waiter.post(`/api/taim/orders/${order.id}/items/${h.id}/came-back`).send({ reason: 'TASTE' }).expect(201)
    return order
}

const range = () => `from=${new Date(Date.now() - 86_400_000).toISOString()}&to=${new Date(Date.now() + 60_000).toISOString()}`

describe('GET /api/taim/losses', () => {
    it('totals with remakes counted, by reason and by dish, and every return', async () => {
        await returns()
        const res = (await manager.get(`/api/taim/losses?${range()}`).expect(200)).body
        // shakshuka + its remake 2800, shakshuka 1400, hummus 900
        expect(res).toMatchObject({ total: 5100, count: 3, remakes: 1 })
        expect(res.byReason).toEqual([{ reason: 'COLD', count: 2, value: 4200 }, { reason: 'TASTE', count: 1, value: 900 }])
        expect(res.byDish).toEqual([{ name: 'Shakshuka', count: 2, value: 4200 }, { name: 'Hummus', count: 1, value: 900 }])
        expect(res.returns.find((r) => r.note)).toMatchObject({ name: 'Shakshuka', title: 'T5', seat: 1, reason: 'COLD', note: 'second one too', by: 'Lior', price: 1400, remakePrice: null, value: 1400 })
        expect(res.returns.find((r) => r.remakePrice)).toMatchObject({ value: 2800 })
    })

    it('only returns in the range', async () => {
        await returns()
        await prisma.itemReturn.updateMany({ data: { createdAt: new Date('2020-05-01') } })
        expect((await manager.get(`/api/taim/losses?${range()}`).expect(200)).body.count).toBe(0)
        const may = (await manager.get('/api/taim/losses?from=2020-05-01T00:00:00Z&to=2020-06-01T00:00:00Z').expect(200)).body
        expect(may.count).toBe(3)
    })

    it('Manager and Chef only; from and to are needed, in order', async () => {
        await (await as('CHEF')).get(`/api/taim/losses?${range()}`).expect(200)
        await waiter.get(`/api/taim/losses?${range()}`).expect(403)
        await manager.get('/api/taim/losses').expect(400)
        const res = await manager.get('/api/taim/losses?from=2026-02-01&to=2026-01-01').expect(400)
        expect(res.body.fields._).toBe('From must be before To')
    })
})
