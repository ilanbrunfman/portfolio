import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'

// Step 6 continued: another dish instead (free, now or later), and waste –
// cancelled after the kitchen started it, dropped, or made wrong and redone.
let waiter, cook, manager, table, shakshuka, kebab, malabi

beforeEach(async () => {
    await resetTaim()
    ;[waiter, cook, manager] = await Promise.all(['WAITER', 'COOK', 'MANAGER'].map(as))
    table = await prisma.diningTable.create({ data: { label: 'T5', seats: 4, position: 1 } })
    const [mains, desserts] = await Promise.all([
        prisma.menuCategory.create({ data: { name: 'Mains', position: 1 } }),
        prisma.menuCategory.create({ data: { name: 'Desserts', position: 2 } }),
    ])
    ;[shakshuka, kebab, malabi] = await Promise.all([
        prisma.menuItem.create({ data: { categoryId: mains.id, name: 'Shakshuka', price: 1400, position: 1 } }),
        prisma.menuItem.create({ data: { categoryId: mains.id, name: 'Kebab', price: 1700, position: 2 } }),
        prisma.menuItem.create({ data: { categoryId: desserts.id, name: 'Malabi', price: 700, position: 1 } }),
    ])
})

/** T5 with a shakshuka for seat 2, sent; served unless cooking = true → { order, shak } */
async function shakshukaFor2({ cooking = false, started = true } = {}) {
    const order = (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests: 2 }).expect(201)).body
    await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: shakshuka.id, seat: 2 }] }).expect(201)
    const sent = (await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)).body
    const shak = sent.items[0]
    if (started) await cook.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(204)
    if (!cooking) await cook.post(`/api/taim/order-items/${shak.id}/serve`).expect(204)
    return { order, shak }
}
const bill = async (id) => (await waiter.get(`/api/taim/orders/${id}`).expect(200)).body
const losses = async () => (await manager.get(`/api/taim/losses?from=${new Date(Date.now() - 86_400_000).toISOString()}&to=${new Date(Date.now() + 60_000).toISOString()}`).expect(200)).body

describe('another dish instead (free)', () => {
    it('the right dish, straight to the kitchen; the kitchen sees what it replaces', async () => {
        const { order, shak } = await shakshukaFor2()
        const res = (await waiter.post(`/api/taim/orders/${order.id}/items/${shak.id}/came-back`).send({ reason: 'WRONG_DISH', replaceWithId: kebab.id }).expect(201)).body
        expect(res.items.find((i) => i.remakeOfId === shak.id)).toMatchObject({ name: 'Kebab', seat: 2, status: 'PREPARING', price: 1700 })
        expect(res.total).toBe(0)
        const ticket = (await cook.get('/api/taim/kitchen').expect(200)).body.tickets[0]
        expect(ticket.dishes[0].remake).toEqual({ reason: 'WRONG_DISH', replaced: 'Shakshuka' })
        const l = await losses()
        expect(l).toMatchObject({ total: 3100, returnsTotal: 3100, wasteTotal: 0 })
        expect(l.returns[0]).toMatchObject({ kind: 'RETURN', remakeName: 'Kebab', value: 3100 })
    })

    it('a dessert on us, for later: it waits on the bill as not sent, free', async () => {
        const { order, shak } = await shakshukaFor2()
        const res = (await waiter.post(`/api/taim/orders/${order.id}/items/${shak.id}/came-back`).send({ reason: 'TASTE', replaceWithId: malabi.id, sendNow: false }).expect(201)).body
        expect(res.items.find((i) => i.remakeOfId)).toMatchObject({ name: 'Malabi', status: 'NEW', round: null })
        expect(res.total).toBe(0)
        expect((await cook.get('/api/taim/kitchen').expect(200)).body.tickets).toEqual([])
        // sent with the next round; still free
        const sent = (await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)).body
        expect(sent.items.find((i) => i.remakeOfId)).toMatchObject({ status: 'PREPARING', round: 2 })
        expect(sent.total).toBe(0)
    })

    it('not both remake and another dish; the other dish must be on the menu and not sold out', async () => {
        const { order, shak } = await shakshukaFor2()
        const url = `/api/taim/orders/${order.id}/items/${shak.id}/came-back`
        expect((await waiter.post(url).send({ reason: 'COLD', remake: true, replaceWithId: kebab.id }).expect(400)).body.fields._).toBe('Pick one: fix it, make it again or another dish')
        expect((await waiter.post(url).send({ reason: 'COLD', replaceWithId: 999 }).expect(400)).body.fields.replaceWithId).toBe('That dish is not on the menu')
        await prisma.menuItem.update({ where: { id: malabi.id }, data: { hidden: true } })
        expect((await waiter.post(url).send({ reason: 'COLD', replaceWithId: malabi.id }).expect(409)).body.error).toBe('Malabi is sold out: choose something else from the menu')
        expect((await bill(order.id)).items[0].status).toBe('SENT_OUT') // nothing changed
    })

    it('a waste reason is not a return reason', async () => {
        const { order, shak } = await shakshukaFor2()
        await waiter.post(`/api/taim/orders/${order.id}/items/${shak.id}/came-back`).send({ reason: 'DROPPED' }).expect(400)
    })
})

describe('waste', () => {
    it('cancelled after the kitchen started it: off the bill, a loss', async () => {
        const { order, shak } = await shakshukaFor2({ cooking: true })
        const res = (await waiter.post(`/api/taim/orders/${order.id}/items/${shak.id}/waste`).send({ reason: 'CANCELLED', note: 'guest had to leave' }).expect(201)).body
        expect(res.items[0]).toMatchObject({ status: 'WASTED', returned: { kind: 'WASTE', reason: 'CANCELLED', note: 'guest had to leave', by: 'Lior' } })
        expect(res.total).toBe(0)
        expect((await cook.get('/api/taim/kitchen').expect(200)).body.tickets).toEqual([])
        expect(await losses()).toMatchObject({ total: 1400, returnsTotal: 0, wasteTotal: 1400 })
    })

    it('not started yet: just remove it (409), nothing was cooked', async () => {
        const { order, shak } = await shakshukaFor2({ cooking: true, started: false })
        const res = await waiter.post(`/api/taim/orders/${order.id}/items/${shak.id}/waste`).send({ reason: 'CANCELLED' }).expect(409)
        expect(res.body.error).toBe("The kitchen hasn't started it: just remove it")
    })

    it('dropped on the way: made again and charged once; the dropped plate is the loss', async () => {
        const { order, shak } = await shakshukaFor2()
        const res = (await waiter.post(`/api/taim/orders/${order.id}/items/${shak.id}/waste`).send({ reason: 'DROPPED', remake: true }).expect(201)).body
        const again = res.items.find((i) => i.id !== shak.id)
        expect(again).toMatchObject({ name: 'Shakshuka', seat: 2, status: 'PREPARING', remakeOfId: null })
        expect(res.total).toBe(1400) // the guest pays once
        expect(await losses()).toMatchObject({ wasteTotal: 1400 })
        expect((await waiter.get('/api/taim/tables').expect(200)).body[0].order).toMatchObject({ dishCount: 1 })
    })

    it('only from the right state; the Host cannot record waste at a table', async () => {
        const { order, shak } = await shakshukaFor2()
        await waiter.post(`/api/taim/orders/${order.id}/items/${shak.id}/waste`).send({ reason: 'CANCELLED' }).expect(409) // served, not cooking
        await (await as('HOST')).post(`/api/taim/orders/${order.id}/items/${shak.id}/waste`).send({ reason: 'DROPPED' }).expect(403)
        await waiter.post(`/api/taim/orders/${order.id}/items/${shak.id}/waste`).send({ reason: 'COLD' }).expect(400)
    })
})

describe('redo in the kitchen (made wrong)', () => {
    it('keeps the ruined plate as waste; the dish starts again, still on the bill once', async () => {
        const { order, shak } = await shakshukaFor2({ cooking: true })
        await cook.post(`/api/taim/order-items/${shak.id}/redo`).send({ note: 'burnt' }).expect(201)
        const b = await bill(order.id)
        expect(b.items.map((i) => i.status).sort()).toEqual(['PREPARING', 'WASTED'])
        expect(b.items.find((i) => i.status === 'WASTED').returned).toMatchObject({ kind: 'WASTE', reason: 'MADE_WRONG', note: 'burnt', by: 'Yossi' })
        expect(b.total).toBe(1400)
        expect(await losses()).toMatchObject({ wasteTotal: 1400 })
        const ticket = (await cook.get('/api/taim/kitchen').expect(200)).body.tickets[0]
        expect(ticket.dishes).toHaveLength(1)
    })

    it('only a dish in the kitchen; only the kitchen (not the Waiter or Manager)', async () => {
        const { shak: served } = await shakshukaFor2()
        await cook.post(`/api/taim/order-items/${served.id}/redo`).send({}).expect(409)

        table = await prisma.diningTable.create({ data: { label: 'T6', seats: 2, position: 2 } })
        const { shak: cooking } = await shakshukaFor2({ cooking: true })
        await waiter.post(`/api/taim/order-items/${cooking.id}/redo`).send({}).expect(403)
        await manager.post(`/api/taim/order-items/${cooking.id}/redo`).send({}).expect(403)
    })
})
