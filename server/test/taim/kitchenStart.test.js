import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'

// Step 5.3: the kitchen starts a ticket, then serves its dishes, so every
// dish has its timeline: sent (who) → started (who) → served (who).
let waiter, cook, chef, table, hummus, kebab

beforeEach(async () => {
    await resetTaim()
    ;[waiter, cook, chef] = await Promise.all(['WAITER', 'COOK', 'CHEF'].map(as))
    table = await prisma.diningTable.create({ data: { label: 'T1', seats: 4, position: 1 } })
    const category = await prisma.menuCategory.create({ data: { name: 'Mains', position: 1 } })
    ;[hummus, kebab] = await Promise.all([
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Hummus', price: 900, position: 1, prepMinutes: 5 } }),
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Kebab', price: 1700, position: 2, prepMinutes: 15 } }),
    ])
})

/** T1: hummus and kebab sent → the order */
async function sent() {
    const order = (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests: 2 }).expect(201)).body
    await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: hummus.id, seat: 1 }, { menuItemId: kebab.id, seat: 2 }] }).expect(201)
    return (await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)).body
}
const kitchen = async () => (await cook.get('/api/taim/kitchen').expect(200)).body
const bill = async (id) => (await waiter.get(`/api/taim/orders/${id}`).expect(200)).body

describe('starting a ticket', () => {
    it('a new ticket is waiting; Start marks its dishes started by whoever tapped', async () => {
        const order = await sent()
        expect((await kitchen()).tickets[0]).toMatchObject({ startedAt: null, startedBy: null })

        await cook.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(204)

        const [ticket] = (await kitchen()).tickets
        expect(ticket).toMatchObject({ startedAt: expect.any(String), startedBy: 'Yossi' })
        expect(ticket.dishes.every((dish) => dish.startedAt)).toBe(true)
        expect((await bill(order.id)).items.map((i) => i.startedBy)).toEqual(['Yossi', 'Yossi'])
    })

    it('starting twice is a 409; an unknown round is a 404', async () => {
        const order = await sent()
        await cook.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(204)
        const again = await chef.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(409)
        expect(again.body.error).toBe('This ticket was already started')
        await cook.post(`/api/taim/orders/${order.id}/rounds/2/start`).expect(404)
    })

    it('only the kitchen can start or serve: not a Waiter, and not the Manager (view only)', async () => {
        const order = await sent()
        const manager = await as('MANAGER')
        await waiter.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(403)
        await manager.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(403)
        await manager.post(`/api/taim/order-items/${order.items[0].id}/serve`).expect(403)
        await manager.get('/api/taim/kitchen').expect(200)
    })
})

describe('the dish timeline', () => {
    it('sent by the waiter, started by the cook, served by the chef', async () => {
        const order = await sent()
        await cook.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(204)
        const dishId = order.items[0].id
        await chef.post(`/api/taim/order-items/${dishId}/serve`).expect(204)

        const dish = (await bill(order.id)).items.find((i) => i.id === dishId)
        expect(dish).toMatchObject({ firedBy: 'Lior', startedBy: 'Yossi', servedBy: 'Avi', status: 'SENT_OUT' })
        expect(new Date(dish.firedAt) <= new Date(dish.startedAt)).toBe(true)
        expect(new Date(dish.startedAt) <= new Date(dish.sentOutAt)).toBe(true)
    })

    it('served without a start (a drink): it started when it was served', async () => {
        const order = await sent()
        await chef.post(`/api/taim/order-items/${order.items[0].id}/serve`).expect(204)
        const dish = (await bill(order.id)).items[0]
        expect(dish).toMatchObject({ startedBy: 'Avi', servedBy: 'Avi' })
        expect(dish.startedAt).toBe(dish.sentOutAt)
    })

    it('undo: back in the kitchen, still started, no longer served', async () => {
        const order = await sent()
        await cook.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(204)
        await cook.post(`/api/taim/order-items/${order.items[0].id}/serve`).expect(204)
        await cook.post(`/api/taim/order-items/${order.items[0].id}/unserve`).expect(204)
        expect((await bill(order.id)).items[0]).toMatchObject({ status: 'PREPARING', startedBy: 'Yossi', servedBy: null, sentOutAt: null })
    })

    it('the database refuses a start on a dish not sent yet', async () => {
        const order = (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests: 2 }).expect(201)).body
        const { items } = (await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: hummus.id, seat: 1 }] }).expect(201)).body
        await expect(prisma.orderItem.update({ where: { id: items[0].id }, data: { startedAt: new Date() } })).rejects.toThrow()
    })
})
