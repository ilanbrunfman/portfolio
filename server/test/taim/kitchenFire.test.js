import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'

// The Chef fires a table's held dishes from the kitchen: only
// when nothing of that table is cooking and its last dish was served at
// least 10 minutes ago (TAIM_KITCHEN_FIRE_AFTER).
let waiter, chef, cook, table, salad, kebab

beforeEach(async () => {
    await resetTaim()
    ;[waiter, chef, cook] = await Promise.all(['WAITER', 'CHEF', 'COOK'].map(as))
    table = await prisma.diningTable.create({ data: { label: 'T6', seats: 4, position: 1 } })
    const category = await prisma.menuCategory.create({ data: { versionId: 1, name: 'Mains', position: 1 } })
    ;[salad, kebab] = await Promise.all([
        prisma.menuItem.create({ data: { versionId: 1, categoryId: category.id, name: 'Salad', price: 800, position: 1, prepMinutes: 5 } }),
        prisma.menuItem.create({ data: { versionId: 1, categoryId: category.id, name: 'Kebab', price: 1700, position: 2, prepMinutes: 15 } }),
    ])
})

/** T6: the salad sent (round 1), two kebabs on hold → the order */
async function startersSentMainsHeld() {
    const order = (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests: 2 }).expect(201)).body
    await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: salad.id, seat: 1 }] }).expect(201)
    await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
    await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: kebab.id, seat: 1, quantity: 2 }] }).expect(201)
    return (await waiter.post(`/api/taim/orders/${order.id}/hold`).expect(200)).body
}

/** Serve the order's cooking dishes `minutesAgo` */
async function servedAgo(orderId, minutesAgo) {
    await prisma.orderItem.updateMany({
        where: { orderId, status: 'PREPARING' },
        data: { status: 'SENT_OUT', sentOutAt: new Date(Date.now() - minutesAgo * 60_000) },
    })
}

const kitchen = async () => (await chef.get('/api/taim/kitchen').expect(200)).body

describe('POST /api/taim/orders/:id/kitchen-fire', () => {
    it('fires the held dishes as the next round, marked as fired by the kitchen', async () => {
        const order = await startersSentMainsHeld()
        await servedAgo(order.id, 12)

        await chef.post(`/api/taim/orders/${order.id}/kitchen-fire`).expect(204)

        const after = (await waiter.get(`/api/taim/orders/${order.id}`).expect(200)).body
        const kebabs = after.items.filter((item) => item.name === 'Kebab')
        expect(kebabs.map((item) => [item.status, item.round, item.held, item.kitchenFired, item.firedBy])).toEqual([
            ['PREPARING', 2, false, true, 'Avi'],
            ['PREPARING', 2, false, true, 'Avi'],
        ])
        // the waiter's own send is recorded too, not as the kitchen's
        expect(after.items.find((item) => item.name === 'Salad')).toMatchObject({ kitchenFired: false, firedBy: 'Lior' })

        const floor = (await waiter.get('/api/taim/tables').expect(200)).body[0].order
        expect(floor).toMatchObject({ onHold: 0, inKitchen: 2, kitchenFiredBy: 'Avi' })
        const k = await kitchen()
        expect(k.onHold).toEqual([])
        expect(k.tickets.map((t) => [t.title, t.round])).toEqual([['T6', 2]])
    })

    it('refused while something of that table is still cooking', async () => {
        const order = await startersSentMainsHeld()
        const res = await chef.post(`/api/taim/orders/${order.id}/kitchen-fire`).expect(409)
        expect(res.body.error).toBe("Still cooking for T6: fire once it's served")
    })

    it('refused until 10 minutes after the last dish was served', async () => {
        const order = await startersSentMainsHeld()
        await servedAgo(order.id, 4)
        const res = await chef.post(`/api/taim/orders/${order.id}/kitchen-fire`).expect(409)
        expect(res.body.error).toBe('Served 4 min ago: the kitchen can fire from 10 min (or ask the waiter)')
        expect((await kitchen()).onHold[0]).toMatchObject({ cooking: 0, lastServedAt: expect.any(String) })
        // the waiter can fire any time
        await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
    })

    it('the kitchen list says what it needs to decide', async () => {
        const order = await startersSentMainsHeld()
        const k = await kitchen()
        expect(k.fireAfterMinutes).toBe(10)
        expect(k.onHold[0]).toMatchObject({ orderId: order.id, cooking: 1, lastServedAt: null })
    })

    it('nothing on hold: 409; unknown order: 404; a second tap changes nothing', async () => {
        const order = await startersSentMainsHeld()
        await servedAgo(order.id, 15)
        await chef.post(`/api/taim/orders/${order.id}/kitchen-fire`).expect(204)
        const again = await chef.post(`/api/taim/orders/${order.id}/kitchen-fire`).expect(409)
        expect(again.body.error).toBe('Nothing on hold for this order')
        await chef.post('/api/taim/orders/999/kitchen-fire').expect(404)
    })

    it('only the Chef: not the Manager (view only), a Cook or the Waiter', async () => {
        const order = await startersSentMainsHeld()
        await servedAgo(order.id, 15)
        await (await as('MANAGER')).post(`/api/taim/orders/${order.id}/kitchen-fire`).expect(403)
        await cook.post(`/api/taim/orders/${order.id}/kitchen-fire`).expect(403)
        await waiter.post(`/api/taim/orders/${order.id}/kitchen-fire`).expect(403)
        await chef.post(`/api/taim/orders/${order.id}/kitchen-fire`).expect(204)
    })

    it('the database refuses a kitchen-fired dish that was never sent', async () => {
        const order = await startersSentMainsHeld()
        const held = order.items.find((item) => item.held)
        await expect(prisma.orderItem.update({ where: { id: held.id }, data: { kitchenFired: true } })).rejects.toThrow()
    })
})
