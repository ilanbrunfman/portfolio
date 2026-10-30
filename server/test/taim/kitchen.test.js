import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'

let waiter, cook, t1, t2, hummus, kebab, malabi

beforeEach(async () => {
    await resetTaim()
    waiter = await as('WAITER')
    cook = await as('COOK')
    ;[t1, t2] = await Promise.all([
        prisma.diningTable.create({ data: { label: 'T1', seats: 4, position: 1 } }),
        prisma.diningTable.create({ data: { label: 'T2', seats: 4, position: 2 } }),
    ])
    const category = await prisma.menuCategory.create({ data: { name: 'Mains', position: 1 } })
    ;[hummus, kebab, malabi] = await Promise.all([
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Hummus', price: 900, position: 1, prepMinutes: 5 } }),
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Kebab', price: 1700, position: 2, prepMinutes: 15 } }),
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Malabi', price: 700, position: 3 } }),
    ])
})

/** Seat a table, add dishes ([dish, seat]) and send them → the order */
async function orderAt(table, dishes) {
    const order = (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests: 3 }).expect(201)).body
    await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: dishes.map(([dish, seat]) => ({ menuItemId: dish.id, seat })) }).expect(201)
    return (await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)).body
}

const kitchen = async () => (await cook.get('/api/taim/kitchen').expect(200)).body

describe('GET /api/taim/kitchen', () => {
    it('one ticket per send, oldest first, dishes by seat with their prep time', async () => {
        const first = await orderAt(t1, [[kebab, 2], [hummus, null], [hummus, 1]])
        // an older ticket on T2: sent a few minutes before
        const second = await orderAt(t2, [[malabi, 1]])
        await prisma.orderItem.updateMany({ where: { orderId: second.id }, data: { firedAt: new Date(Date.now() - 5 * 60_000) } })

        const { tickets } = await kitchen()
        expect(tickets.map((t) => [t.title, t.round])).toEqual([['T2', 1], ['T1', 1]])
        expect(tickets[1].dishes.map((d) => [d.name, d.seat, d.prepMinutes])).toEqual([['Hummus', 1, 5], ['Kebab', 2, 15], ['Hummus', null, 5]])
        expect(tickets[0].dishes[0].prepMinutes).toBeNull()
        expect(first.items).toHaveLength(3)
    })

    it('a later round of the same table is its own ticket; dishes not sent yet are not in the kitchen', async () => {
        const order = await orderAt(t1, [[hummus, 1]])
        await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: kebab.id, seat: 1 }] }).expect(201)
        expect((await kitchen()).tickets.map((t) => t.round)).toEqual([1]) // the kebab isn't sent yet
        await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
        expect((await kitchen()).tickets.map((t) => [t.title, t.round])).toEqual([['T1', 1], ['T1', 2]])
    })

    it('a take-out ticket is titled with the name', async () => {
        const takeout = (await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya' }).expect(201)).body
        await waiter.post(`/api/taim/orders/${takeout.id}/items`).send({ items: [{ menuItemId: hummus.id }] }).expect(201)
        await waiter.post(`/api/taim/orders/${takeout.id}/send`).expect(200)
        expect((await kitchen()).tickets[0]).toMatchObject({ title: 'Take-out · Maya', type: 'TAKEOUT' })
    })
})

describe('serving dishes (advanceDish: Manager, Chef, Cook)', () => {
    it('serve takes a dish off the kitchen list; undo puts it back', async () => {
        const order = await orderAt(t1, [[hummus, 1], [kebab, 2]])
        const [dish] = order.items

        await cook.post(`/api/taim/order-items/${dish.id}/serve`).expect(204)
        const after = await kitchen()
        expect(after.tickets[0].dishes.map((d) => d.name)).toEqual(['Kebab'])
        expect(after.recentlyServed).toMatchObject([{ id: dish.id, name: 'Hummus', seat: 1, title: 'T1' }])

        await cook.post(`/api/taim/order-items/${dish.id}/unserve`).expect(204)
        expect((await kitchen()).tickets[0].dishes.map((d) => d.name)).toEqual(['Hummus', 'Kebab'])
    })

    it('a served table is "all served" on the floor; the bill can then be closed', async () => {
        const order = await orderAt(t1, [[hummus, 1]])
        await cook.post(`/api/taim/order-items/${order.items[0].id}/serve`).expect(204)
        const floor = (await waiter.get('/api/taim/tables').expect(200)).body
        expect(floor[0].order).toMatchObject({ notSent: 0, inKitchen: 0, dishCount: 1 })
        await waiter.post(`/api/taim/orders/${order.id}/close`).expect(200)
    })

    it('only from the right state: no double serve, no undo of a dish in the kitchen', async () => {
        const order = await orderAt(t1, [[hummus, 1]])
        const id = order.items[0].id
        await cook.post(`/api/taim/order-items/${id}/unserve`).expect(409)
        await cook.post(`/api/taim/order-items/${id}/serve`).expect(204)
        const twice = await cook.post(`/api/taim/order-items/${id}/serve`).expect(409)
        expect(twice.body.error).toBe('Only a dish in the kitchen can be marked served')
        await cook.post('/api/taim/order-items/999/serve').expect(404)
    })

    it('two cooks tapping the same dish at once: only one succeeds', async () => {
        const order = await orderAt(t1, [[hummus, 1]])
        const chef = await as('CHEF')
        const results = await Promise.all([cook, chef, cook].map((agent) => agent.post(`/api/taim/order-items/${order.items[0].id}/serve`)))
        expect(results.map((r) => r.status).sort()).toEqual([204, 409, 409])
    })

    it('Waiter and Host cannot serve; a dish not sent yet cannot be served', async () => {
        const order = await orderAt(t1, [[hummus, 1]])
        await waiter.post(`/api/taim/order-items/${order.items[0].id}/serve`).expect(403)
        await (await as('HOST')).post(`/api/taim/order-items/${order.items[0].id}/serve`).expect(403)

        const { items } = (await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: kebab.id, seat: 2 }] }).expect(201)).body
        await cook.post(`/api/taim/order-items/${items[1].id}/serve`).expect(409)
    })
})
