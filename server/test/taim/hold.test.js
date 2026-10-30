import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'

// Hold and fire: the waiter takes the whole order, sends the starters now
// and holds the mains until the table is ready for them.
let waiter, cook, table, hummus, salad, kebab

beforeEach(async () => {
    await resetTaim()
    waiter = await as('WAITER')
    cook = await as('COOK')
    table = await prisma.diningTable.create({ data: { label: 'T1', seats: 4, position: 1 } })
    const [starters, mains] = await Promise.all([
        prisma.menuCategory.create({ data: { name: 'Starters', position: 1 } }),
        prisma.menuCategory.create({ data: { name: 'Mains', position: 2 } }),
    ])
    ;[hummus, salad, kebab] = await Promise.all([
        prisma.menuItem.create({ data: { categoryId: starters.id, name: 'Hummus', price: 900, position: 1, prepMinutes: 5 } }),
        prisma.menuItem.create({ data: { categoryId: starters.id, name: 'Salad', price: 800, position: 2 } }),
        prisma.menuItem.create({ data: { categoryId: mains.id, name: 'Kebab', price: 1700, position: 1, prepMinutes: 15 } }),
    ])
})

/** Seat T1 and add hummus + salad (starters) and two kebabs (mains), not sent */
async function wholeOrder() {
    const order = (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests: 2 }).expect(201)).body
    const items = [{ menuItemId: hummus.id, seat: 1 }, { menuItemId: salad.id, seat: 2 }, { menuItemId: kebab.id, seat: 1 }, { menuItemId: kebab.id, seat: 2 }]
    return (await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items }).expect(201)).body
}
const starterIds = (order) => order.items.filter((item) => item.category === 'Starters').map((item) => item.id)
const floorOrder = async () => (await waiter.get('/api/taim/tables').expect(200)).body[0].order

describe('send some dishes, hold the rest', () => {
    it('the starters go to the kitchen; the mains wait on hold', async () => {
        const order = await wholeOrder()
        const sent = (await waiter.post(`/api/taim/orders/${order.id}/send`).send({ itemIds: starterIds(order) }).expect(200)).body

        const byName = (name) => sent.items.filter((item) => item.name === name)
        expect(byName('Hummus')[0]).toMatchObject({ status: 'PREPARING', round: 1, held: false })
        expect(byName('Kebab').map((item) => [item.status, item.round, item.held])).toEqual([['NEW', null, true], ['NEW', null, true]])
        expect(await floorOrder()).toMatchObject({ notSent: 0, onHold: 2, inKitchen: 2 })
    })

    it('the kitchen sees the held dishes apart from what it is cooking', async () => {
        const order = await wholeOrder()
        await waiter.post(`/api/taim/orders/${order.id}/send`).send({ itemIds: starterIds(order) }).expect(200)
        const kitchen = (await cook.get('/api/taim/kitchen').expect(200)).body
        expect(kitchen.tickets[0].dishes.map((d) => d.name)).toEqual(['Hummus', 'Salad'])
        expect(kitchen.onHold).toMatchObject([{ orderId: order.id, title: 'T1', dishes: [{ name: 'Kebab', seat: 1, prepMinutes: 15 }, { name: 'Kebab', seat: 2 }] }])
    })

    it('Fire sends the held dishes (and any added since) as the next round', async () => {
        const order = await wholeOrder()
        await waiter.post(`/api/taim/orders/${order.id}/send`).send({ itemIds: starterIds(order) }).expect(200)
        await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: salad.id, seat: 1 }] }).expect(201)

        const fired = (await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)).body
        expect(fired.items.filter((item) => item.round === 2).map((item) => item.name).sort()).toEqual(['Kebab', 'Kebab', 'Salad'])
        expect(fired.items.every((item) => !item.held)).toBe(true)
        expect((await cook.get('/api/taim/kitchen').expect(200)).body.onHold).toEqual([])
    })

    it('sending every dish holds nothing', async () => {
        const order = await wholeOrder()
        const sent = (await waiter.post(`/api/taim/orders/${order.id}/send`).send({ itemIds: order.items.map((item) => item.id) }).expect(200)).body
        expect(sent.items.every((item) => item.status === 'PREPARING' && !item.held)).toBe(true)
    })

    it('a held dish can be removed or moved to another seat like any dish not sent', async () => {
        const order = await wholeOrder()
        await waiter.post(`/api/taim/orders/${order.id}/send`).send({ itemIds: starterIds(order) }).expect(200)
        const [kebab1, kebab2] = order.items.filter((item) => item.name === 'Kebab')
        await waiter.patch(`/api/taim/orders/${order.id}/items/${kebab1.id}`).send({ seat: null }).expect(200)
        const after = (await waiter.delete(`/api/taim/orders/${order.id}/items/${kebab2.id}`).expect(200)).body
        expect(after.items.filter((item) => item.held).map((item) => item.seat)).toEqual([null])
    })
})

describe('what is refused', () => {
    it('only dishes not sent yet on this order can be picked', async () => {
        const order = await wholeOrder()
        await waiter.post(`/api/taim/orders/${order.id}/send`).send({ itemIds: starterIds(order) }).expect(200)
        // a starter that's already in the kitchen
        const again = await waiter.post(`/api/taim/orders/${order.id}/send`).send({ itemIds: starterIds(order) }).expect(409)
        expect(again.body.error).toBe('A dish was already sent or removed: refresh the order and try again')
        await waiter.post(`/api/taim/orders/${order.id}/send`).send({ itemIds: [99999] }).expect(409)
    })

    it('an empty pick is a validation error', async () => {
        const order = await wholeOrder()
        const res = await waiter.post(`/api/taim/orders/${order.id}/send`).send({ itemIds: [] }).expect(400)
        expect(res.body.fields.itemIds).toBe('Pick at least one dish to send')
    })

    it('the bill cannot be closed while dishes are on hold', async () => {
        const order = await wholeOrder()
        await waiter.post(`/api/taim/orders/${order.id}/send`).send({ itemIds: starterIds(order) }).expect(200)
        for (const item of (await cook.get('/api/taim/kitchen').expect(200)).body.tickets[0].dishes) {
            await cook.post(`/api/taim/order-items/${item.id}/serve`).expect(204)
        }
        const res = await waiter.post(`/api/taim/orders/${order.id}/close`).expect(409)
        expect(res.body.error).toBe('2 dishes are on hold: fire or remove them first')
    })

    it('the database refuses a held dish that is already in the kitchen', async () => {
        const order = await wholeOrder()
        await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
        await expect(prisma.orderItem.update({ where: { id: order.items[0].id }, data: { held: true } })).rejects.toThrow()
    })
})
