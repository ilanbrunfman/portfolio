import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'

// Step 5.2: the guests finished eating and take a few dishes home. They go on
// the same bill, marked to go, so the kitchen packs them.
let waiter, cook, table, hummus, kebab

beforeEach(async () => {
    await resetTaim()
    ;[waiter, cook] = await Promise.all(['WAITER', 'COOK'].map(as))
    table = await prisma.diningTable.create({ data: { label: 'T5', seats: 4, position: 1 } })
    const category = await prisma.menuCategory.create({ data: { versionId: 1, name: 'Mains', position: 1 } })
    ;[hummus, kebab] = await Promise.all([
        prisma.menuItem.create({ data: { versionId: 1, categoryId: category.id, name: 'Hummus', price: 900, position: 1 } }),
        prisma.menuItem.create({ data: { versionId: 1, categoryId: category.id, name: 'Kebab', price: 1700, position: 2 } }),
    ])
})

/** T5 ate a hummus (served) → the order */
async function dinnerEaten() {
    const order = (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests: 2 }).expect(201)).body
    await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: hummus.id, seat: 1 }] }).expect(201)
    await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
    await prisma.orderItem.updateMany({ where: { orderId: order.id }, data: { status: 'SENT_OUT', sentOutAt: new Date() } })
    return order
}

describe('to-go dishes on a table bill', () => {
    it('adds them to the same bill, marked to go; the kitchen and floor see it', async () => {
        const order = await dinnerEaten()
        const added = (await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: kebab.id, seat: 2, quantity: 2, toGo: true }] }).expect(201)).body
        expect(added.items.map((i) => [i.name, i.toGo])).toEqual([['Hummus', false], ['Kebab', true], ['Kebab', true]])
        expect(added.total).toBe(900 + 2 * 1700)

        await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
        const kitchen = (await cook.get('/api/taim/kitchen').expect(200)).body
        expect(kitchen.tickets).toMatchObject([{ title: 'T5', round: 2, dishes: [{ name: 'Kebab', toGo: true }, { name: 'Kebab', toGo: true }] }])
        const floor = (await waiter.get('/api/taim/tables').expect(200)).body[0].order
        expect(floor).toMatchObject({ inKitchen: 2, toGoInKitchen: 2 })

        // the bill can't close until they're packed (served)
        await waiter.post(`/api/taim/orders/${order.id}/close`).expect(409)
        for (const dish of kitchen.tickets[0].dishes) await cook.post(`/api/taim/order-items/${dish.id}/serve`).expect(204)
        expect((await cook.get('/api/taim/kitchen').expect(200)).body.recentlyServed[0]).toMatchObject({ toGo: true })
        const closed = (await waiter.post(`/api/taim/orders/${order.id}/close`).expect(200)).body
        expect(closed.total).toBe(4300)
    })

    it('a dish can be switched to go (or back) while the bill is open', async () => {
        const order = await dinnerEaten()
        const { id } = await prisma.orderItem.findFirstOrThrow({ where: { orderId: order.id } })
        const res = (await waiter.patch(`/api/taim/orders/${order.id}/items/${id}`).send({ toGo: true }).expect(200)).body
        expect(res.items[0]).toMatchObject({ toGo: true, seat: 1 }) // the seat stays
        const back = (await waiter.patch(`/api/taim/orders/${order.id}/items/${id}`).send({ toGo: false, seat: 2 }).expect(200)).body
        expect(back.items[0]).toMatchObject({ toGo: false, seat: 2 })
        const empty = await waiter.patch(`/api/taim/orders/${order.id}/items/${id}`).send({}).expect(400)
        expect(empty.body.fields._).toBe('Nothing to update')
    })

    it('a take-out is to go already: toGo on it is refused', async () => {
        const takeout = (await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya' }).expect(201)).body
        const res = await waiter.post(`/api/taim/orders/${takeout.id}/items`).send({ items: [{ menuItemId: kebab.id, toGo: true }] }).expect(400)
        expect(res.body.fields.items).toBe('A take-out is to go already')
        const ok = (await waiter.post(`/api/taim/orders/${takeout.id}/items`).send({ items: [{ menuItemId: kebab.id }] }).expect(201)).body
        await waiter.patch(`/api/taim/orders/${takeout.id}/items/${ok.items[0].id}`).send({ toGo: true }).expect(400)
    })

    it('toGo must be true or false', async () => {
        const order = await dinnerEaten()
        const res = await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: kebab.id, toGo: 'yes' }] }).expect(400)
        expect(res.body.fields['items.0.toGo']).toBe('To go must be true or false')
    })
})
