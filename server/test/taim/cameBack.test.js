import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'

// Step 6: a guest gives a served dish back. It leaves the bill and counts as
// a loss; a remake is on the house, goes straight to the kitchen, and its
// price counts as a loss too.
let waiter, cook, host, table, shakshuka, hummus

beforeEach(async () => {
    await resetTaim()
    ;[waiter, cook, host] = await Promise.all(['WAITER', 'COOK', 'HOST'].map(as))
    table = await prisma.diningTable.create({ data: { label: 'T5', seats: 4, position: 1 } })
    const category = await prisma.menuCategory.create({ data: { name: 'Mains', position: 1 } })
    ;[shakshuka, hummus] = await Promise.all([
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Shakshuka', price: 1400, position: 1, prepMinutes: 12 } }),
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Hummus', price: 900, position: 2 } }),
    ])
})

/** T5: a shakshuka for seat 2 and a hummus, both served → { order, shak } */
async function served() {
    const order = (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests: 2 }).expect(201)).body
    await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: shakshuka.id, seat: 2 }, { menuItemId: hummus.id, seat: null }] }).expect(201)
    const sent = (await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)).body
    for (const item of sent.items) await cook.post(`/api/taim/order-items/${item.id}/serve`).expect(204)
    return { order, shak: sent.items.find((i) => i.name === 'Shakshuka') }
}
const back = (order, item, body) => waiter.post(`/api/taim/orders/${order.id}/items/${item.id}/came-back`).send(body)

describe('a dish comes back', () => {
    it('without a remake: off the bill, with the reason, note and who', async () => {
        const { order, shak } = await served()
        const res = (await back(order, shak, { reason: 'COLD', note: '  lukewarm in the middle ' }).expect(201)).body
        const dish = res.items.find((i) => i.id === shak.id)
        expect(dish).toMatchObject({ status: 'CAME_BACK', returned: { reason: 'COLD', note: 'lukewarm in the middle', by: 'Lior' } })
        expect(res.total).toBe(900)
        const floor = (await waiter.get('/api/taim/tables').expect(200)).body[0].order
        expect(floor).toMatchObject({ cameBack: 1, total: 900 })
    })

    it('with a remake: a free copy for the same seat goes straight to the kitchen, first in line', async () => {
        const { order, shak } = await served()
        // another table's ticket, sent earlier
        await prisma.diningTable.create({ data: { label: 'T6', seats: 2, position: 2 } })
        const other = (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: 2, guests: 1 }).expect(201)).body
        await waiter.post(`/api/taim/orders/${other.id}/items`).send({ items: [{ menuItemId: hummus.id, seat: 1 }] }).expect(201)
        await waiter.post(`/api/taim/orders/${other.id}/send`).expect(200)

        const res = (await back(order, shak, { reason: 'COLD', remake: true }).expect(201)).body
        const remake = res.items.find((i) => i.remakeOfId === shak.id)
        expect(remake).toMatchObject({ name: 'Shakshuka', seat: 2, status: 'PREPARING', round: 2, price: 1400 })
        expect(res.total).toBe(900) // the remake is on the house

        const kitchen = (await cook.get('/api/taim/kitchen').expect(200)).body
        expect(kitchen.tickets.map((t) => [t.title, t.remake])).toEqual([['T5', true], ['T6', false]])
        expect(kitchen.tickets[0].dishes[0].remake).toEqual({ reason: 'COLD' })
        expect(kitchen.cameBack).toMatchObject([{ name: 'Shakshuka', title: 'T5', seat: 2, reason: 'COLD', by: 'Lior', remade: true }])
    })

    it('the day report counts the returned dish and its remake as lost, not as sales', async () => {
        const { order, shak } = await served()
        const res = (await back(order, shak, { reason: 'TASTE', remake: true }).expect(201)).body
        await cook.post(`/api/taim/order-items/${res.items.find((i) => i.remakeOfId).id}/serve`).expect(204)
        await waiter.post(`/api/taim/orders/${order.id}/close`).expect(200)
        const day = (await (await as('MANAGER')).post('/api/taim/days/close').expect(201)).body
        expect(day).toMatchObject({ sales: 900, cameBack: 1, cameBackValue: 2800 })
    })

    it('only a served dish, once; a sold-out dish cannot be remade', async () => {
        const { order, shak } = await served()
        await back(order, shak, { reason: 'COLD' }).expect(201)
        const twice = await back(order, shak, { reason: 'COLD' }).expect(409)
        expect(twice.body.error).toBe('Only a served dish can come back')

        const { items } = (await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: hummus.id }] }).expect(201)).body
        await back(order, items.at(-1), { reason: 'COLD' }).expect(409) // not sent yet

        const hum = items.find((i) => i.name === 'Hummus' && i.status === 'SENT_OUT')
        await prisma.menuItem.update({ where: { id: hummus.id }, data: { hidden: true } })
        const soldOut = await back(order, hum, { reason: 'COLD', remake: true }).expect(409)
        expect(soldOut.body.error).toBe('Hummus is sold out: choose something else from the menu')
    })

    it('needs a reason; the note is at most 200 characters', async () => {
        const { order, shak } = await served()
        expect((await back(order, shak, {}).expect(400)).body.fields.reason).toBe('Pick a reason')
        expect((await back(order, shak, { reason: 'COLD', note: 'x'.repeat(201) }).expect(400)).body.fields.note).toBe('Max 200 characters')
    })

    it('Manager, Chef and Waiter can mark it; a Host or Cook cannot', async () => {
        const { order, shak } = await served()
        await host.post(`/api/taim/orders/${order.id}/items/${shak.id}/came-back`).send({ reason: 'COLD' }).expect(403)
        await cook.post(`/api/taim/orders/${order.id}/items/${shak.id}/came-back`).send({ reason: 'COLD' }).expect(403)
        await (await as('CHEF')).post(`/api/taim/orders/${order.id}/items/${shak.id}/came-back`).send({ reason: 'COLD' }).expect(201)
    })
})

describe('undo came back', () => {
    it('puts it back on the bill and drops a remake the kitchen has not served', async () => {
        const { order, shak } = await served()
        await back(order, shak, { reason: 'COLD', remake: true }).expect(201)
        const res = (await waiter.delete(`/api/taim/orders/${order.id}/items/${shak.id}/came-back`).expect(200)).body
        expect(res.items.find((i) => i.id === shak.id)).toMatchObject({ status: 'SENT_OUT', returned: null })
        expect(res.items.some((i) => i.remakeOfId)).toBe(false)
        expect(res.total).toBe(2300)
        expect(await prisma.itemReturn.count()).toBe(0)
    })

    it('refused once the remake was served, or for a dish that did not come back', async () => {
        const { order, shak } = await served()
        const res = (await back(order, shak, { reason: 'COLD', remake: true }).expect(201)).body
        await cook.post(`/api/taim/order-items/${res.items.find((i) => i.remakeOfId).id}/serve`).expect(204)
        const err = await waiter.delete(`/api/taim/orders/${order.id}/items/${shak.id}/came-back`).expect(409)
        expect(err.body.error).toBe('Its remake was already served, so the return stays')
        const hum = res.items.find((i) => i.name === 'Hummus')
        await waiter.delete(`/api/taim/orders/${order.id}/items/${hum.id}/came-back`).expect(409)
    })

    it('not on a closed bill', async () => {
        const { order, shak } = await served()
        await back(order, shak, { reason: 'COLD' }).expect(201)
        await waiter.post(`/api/taim/orders/${order.id}/close`).expect(200)
        await waiter.delete(`/api/taim/orders/${order.id}/items/${shak.id}/came-back`).expect(409)
    })
})
