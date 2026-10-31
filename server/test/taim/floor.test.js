import { describe, it, expect, beforeEach } from 'vitest'
import { anonymous, resetTaim, as, prisma } from './helpers.js'

let host, waiter, t1, t2, hummus, shakshuka, schnitzel

beforeEach(async () => {
    await resetTaim()
    host = await as('HOST')
    waiter = await as('WAITER')
    ;[t1, t2] = await Promise.all([
        prisma.diningTable.create({ data: { label: 'T1', seats: 2, position: 1 } }),
        prisma.diningTable.create({ data: { label: 'T2', seats: 4, position: 2 } }),
    ])
    const category = await prisma.menuCategory.create({ data: { versionId: 1, name: 'Mains', position: 1 } })
    ;[hummus, shakshuka, schnitzel] = await Promise.all([
        prisma.menuItem.create({ data: { versionId: 1, categoryId: category.id, name: 'Hummus', price: 900, position: 1 } }),
        prisma.menuItem.create({ data: { versionId: 1, categoryId: category.id, name: 'Shakshuka', price: 1400, position: 2 } }),
        prisma.menuItem.create({ data: { versionId: 1, categoryId: category.id, name: 'Schnitzel', price: 1800, position: 3, hidden: true } }),
    ])
})

const seat = (agent, table = t1, guests = 2) => agent.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests })

/** The kitchen serves every dish of an order that's being prepared (as the Cook) */
async function serveAll(orderId) {
    const cook = await as('COOK')
    const dishes = await prisma.orderItem.findMany({ where: { orderId, status: 'PREPARING' } })
    for (const dish of dishes) await cook.post(`/api/taim/order-items/${dish.id}/serve`).expect(204)
}
const addDishes = (agent, orderId, items) => agent.post(`/api/taim/orders/${orderId}/items`).send({ items })

describe('tables', () => {
    it('lists the floor in order; a table is free until it is seated', async () => {
        const before = await host.get('/api/taim/tables').expect(200)
        expect(before.body.map((t) => [t.label, t.order])).toEqual([['T1', null], ['T2', null]])

        const order = (await seat(host, t2, 3).expect(201)).body
        const after = await host.get('/api/taim/tables').expect(200)
        expect(after.body[1].order).toMatchObject({ id: order.id, guests: 3, dishCount: 0, total: 0 })
    })

    it('only the Manager sets up tables', async () => {
        await host.post('/api/taim/tables').send({ label: 'T3', seats: 4 }).expect(403)
        const manager = await as('MANAGER')
        const res = await manager.post('/api/taim/tables').send({ label: ' T3 ', seats: 4 }).expect(201)
        expect(res.body).toMatchObject({ label: 'T3', seats: 4, position: 3, order: null })

        const dup = await manager.post('/api/taim/tables').send({ label: 'T1', seats: 2 }).expect(409)
        expect(dup.body.fields).toEqual({ label: 'There is already a table with this label' })
        await manager.patch(`/api/taim/tables/${t1.id}`).send({ seats: 0 }).expect(400)
        await manager.patch(`/api/taim/tables/${t1.id}`).send({ seats: 3 }).expect(200)
    })
})

describe('seating and take-out (seatTable: Manager, Host, Waiter)', () => {
    it('seats a table, remembering who opened it', async () => {
        const res = await seat(host, t1, 2).expect(201)
        expect(res.body).toMatchObject({
            type: 'TABLE', status: 'OPEN', table: { id: t1.id, label: 'T1' }, guests: 2,
            customerName: null, openedBy: { name: 'Dana' }, items: [], total: 0,
        })
    })

    it('refuses to seat a table that already has an open order (409)', async () => {
        await seat(host).expect(201)
        const res = await seat(waiter).expect(409)
        expect(res.body.error).toBe('This table is already seated')
    })

    it('the database refuses it too, even when two requests race', async () => {
        const results = await Promise.all([seat(host), seat(waiter), seat(host)])
        expect(results.map((r) => r.status).sort()).toEqual([201, 409, 409])
        expect(await prisma.order.count({ where: { tableId: t1.id, status: 'OPEN' } })).toBe(1)
    })

    it('starts a take-out with a name and phone, and no table', async () => {
        const res = await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: '  Maya ', customerPhone: ' +972 50-123-4567 ' }).expect(201)
        expect(res.body).toMatchObject({ type: 'TAKEOUT', table: null, guests: null, customerName: 'Maya', customerPhone: '+972 50-123-4567' })
    })

    it('the phone is optional, but must look like a phone number when given', async () => {
        for (const phone of [undefined, '', '   ', null]) {
            const res = await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya', customerPhone: phone }).expect(201)
            expect(res.body.customerPhone).toBeNull()
        }
        for (const phone of ['abc', '12', '050-12x-4567']) {
            const res = await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya', customerPhone: phone }).expect(400)
            expect(res.body.fields).toEqual({ customerPhone: 'Enter a phone number, e.g. 050-123-4567' })
        }
    })

    it('the database refuses a phone on a table order', async () => {
        const order = (await seat(host).expect(201)).body
        expect(order.customerPhone).toBeNull()
        await expect(prisma.order.update({ where: { id: order.id }, data: { customerPhone: '050-123-4567' } })).rejects.toThrow(/orders_phone_takeout_only/)
    })

    it('validates the request', async () => {
        const noGuests = await host.post('/api/taim/orders').send({ type: 'TABLE', tableId: t1.id }).expect(400)
        expect(noGuests.body.fields).toEqual({ guests: 'Guests must be a whole number above 0' })
        const noTable = await host.post('/api/taim/orders').send({ type: 'TABLE', tableId: 999, guests: 2 }).expect(400)
        expect(noTable.body.fields).toEqual({ tableId: 'Table not found' })
        const noName = await host.post('/api/taim/orders').send({ type: 'TAKEOUT' }).expect(400)
        expect(noName.body.fields).toEqual({ customerName: 'Name is required' })
        await host.post('/api/taim/orders').send({ type: 'DELIVERY' }).expect(400)
    })

    it('Cook and Chef cannot seat anyone', async () => {
        for (const role of ['COOK', 'CHEF']) await seat(await as(role)).expect(403)
        await anonymous.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Bob', customerPhone: '050-123-4567' }).expect(401)
    })
})

describe('adding dishes (addDishes: Manager, Waiter)', () => {
    it('adds one row per dish, with the menu price copied in', async () => {
        const order = (await seat(host).expect(201)).body
        const res = await addDishes(waiter, order.id, [{ menuItemId: hummus.id, quantity: 2 }, { menuItemId: shakshuka.id }]).expect(201)

        expect(res.body.items.map((i) => [i.name, i.price, i.status])).toEqual([
            ['Hummus', 900, 'NEW'], ['Hummus', 900, 'NEW'], ['Shakshuka', 1400, 'NEW'],
        ])
        expect(res.body.total).toBe(3200)
    })

    it('keeps the old price on the bill when a new menu changes it; the old dish can no longer be added', async () => {
        const order = (await seat(host).expect(201)).body
        await addDishes(waiter, order.id, [{ menuItemId: shakshuka.id }]).expect(201)
        // A new menu with the new price: draft, change, publish
        const chef = await as('CHEF')
        const draft = (await chef.post('/api/taim/menu/versions').send({ name: 'New prices' }).expect(201)).body
        const newShakshuka = await prisma.menuItem.findFirstOrThrow({ where: { versionId: draft.id, name: 'Shakshuka' } })
        await chef.patch(`/api/taim/menu-items/${newShakshuka.id}`).send({ price: 1500 }).expect(200)
        await chef.post(`/api/taim/menu/versions/${draft.id}/publish`).send({}).expect(200)

        const old = await addDishes(waiter, order.id, [{ menuItemId: shakshuka.id }]).expect(409)
        expect(old.body.error).toBe('Shakshuka is from another menu: reload the menu')
        await addDishes(waiter, order.id, [{ menuItemId: newShakshuka.id }]).expect(201)

        const res = await waiter.get(`/api/taim/orders/${order.id}`).expect(200)
        expect(res.body.items.map((i) => i.price)).toEqual([1400, 1500])
        expect(res.body.total).toBe(2900)
    })

    it('refuses a sold-out dish, an unknown dish, and adds nothing', async () => {
        const order = (await seat(host).expect(201)).body
        const soldOut = await addDishes(waiter, order.id, [{ menuItemId: hummus.id }, { menuItemId: schnitzel.id }]).expect(409)
        expect(soldOut.body.error).toBe('Schnitzel is sold out')
        await addDishes(waiter, order.id, [{ menuItemId: 999 }]).expect(400)
        await addDishes(waiter, order.id, []).expect(400)
        expect(await prisma.orderItem.count()).toBe(0)
    })

    it('Host cannot add dishes (403); a closed bill takes no more (409)', async () => {
        const order = (await seat(host).expect(201)).body
        await addDishes(host, order.id, [{ menuItemId: hummus.id }]).expect(403)
        await host.post(`/api/taim/orders/${order.id}/close`).expect(200)
        const res = await addDishes(waiter, order.id, [{ menuItemId: hummus.id }]).expect(409)
        expect(res.body.error).toBe('This bill is already closed')
    })

    it('removes a dish not sent yet or still being prepared, but not one already sent out', async () => {
        const order = (await seat(host).expect(201)).body
        const { items } = (await addDishes(waiter, order.id, [{ menuItemId: hummus.id, quantity: 3 }]).expect(201)).body
        await prisma.orderItem.update({ where: { id: items[1].id }, data: { round: 1, status: 'PREPARING' } })
        await prisma.orderItem.update({ where: { id: items[2].id }, data: { round: 1, status: 'SENT_OUT', sentOutAt: new Date() } })

        await waiter.delete(`/api/taim/orders/${order.id}/items/${items[0].id}`).expect(200)
        const res = await waiter.delete(`/api/taim/orders/${order.id}/items/${items[1].id}`).expect(200)
        expect(res.body.items).toHaveLength(1)
        const sent = await waiter.delete(`/api/taim/orders/${order.id}/items/${items[2].id}`).expect(409)
        expect(sent.body.error).toBe('The kitchen already sent this dish out, so it stays on the bill')
        await waiter.delete(`/api/taim/orders/${order.id}/items/999`).expect(404)
    })
})

describe('closing the bill (closeBill: Manager, Host, Waiter)', () => {
    it('closes the order and frees the table; the total leaves out dishes that came back', async () => {
        const order = (await seat(host).expect(201)).body
        const { items } = (await addDishes(waiter, order.id, [{ menuItemId: hummus.id }, { menuItemId: shakshuka.id }]).expect(201)).body
        await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
        await prisma.orderItem.update({ where: { id: items[1].id }, data: { round: 1, status: 'CAME_BACK' } })
        await serveAll(order.id)

        const res = await host.post(`/api/taim/orders/${order.id}/close`).expect(200)
        expect(res.body).toMatchObject({ status: 'CLOSED', total: 900, closedAt: expect.any(String) })

        const tables = await host.get('/api/taim/tables').expect(200)
        expect(tables.body[0]).toMatchObject({ order: null, needsCleaning: true })
    })

    it('a closed bill cannot be closed again; open and closed lists', async () => {
        const order = (await seat(host).expect(201)).body
        await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya', customerPhone: '050-123-4567' }).expect(201)
        await host.post(`/api/taim/orders/${order.id}/close`).expect(200)
        await host.post(`/api/taim/orders/${order.id}/close`).expect(409)
        await host.post('/api/taim/orders/999/close').expect(404)
        await (await as('COOK')).post(`/api/taim/orders/${order.id}/close`).expect(403)

        const open = await host.get('/api/taim/orders').expect(200)
        expect(open.body.map((o) => o.customerName)).toEqual(['Maya'])
        const closed = await host.get('/api/taim/orders?status=CLOSED').expect(200)
        expect(closed.body.map((o) => o.id)).toEqual([order.id])
    })
})

describe('cleaning (cleanTable: Manager, Host, Waiter)', () => {
    const closeT1 = async () => {
        const order = (await seat(host).expect(201)).body
        await host.post(`/api/taim/orders/${order.id}/close`).expect(200)
    }

    it('a table that needs cleaning cannot be seated until it is marked clean', async () => {
        await closeT1()
        const res = await seat(waiter).expect(409)
        expect(res.body.error).toBe('T1 needs cleaning first')

        const cleaned = await waiter.post(`/api/taim/tables/${t1.id}/clean`).expect(200)
        expect(cleaned.body).toMatchObject({ label: 'T1', needsCleaning: false, order: null })
        await seat(host).expect(201)
    })

    it('a ready table can be sent back to cleaning, and then cannot be seated', async () => {
        const res = await host.post(`/api/taim/tables/${t1.id}/needs-cleaning`).expect(200)
        expect(res.body).toMatchObject({ label: 'T1', needsCleaning: true, order: null })
        expect((await seat(waiter).expect(409)).body.error).toBe('T1 needs cleaning first')

        await waiter.post(`/api/taim/tables/${t1.id}/clean`).expect(200)
        await seat(waiter).expect(201)
        const dining = await host.post(`/api/taim/tables/${t1.id}/needs-cleaning`).expect(409)
        expect(dining.body.error).toBe('T1 still has guests')
        await (await as('COOK')).post(`/api/taim/tables/${t2.id}/needs-cleaning`).expect(403)
    })

    it('Cook and Chef cannot mark a table clean; a table with guests is not "clean"', async () => {
        await closeT1()
        await (await as('COOK')).post(`/api/taim/tables/${t1.id}/clean`).expect(403)
        await (await as('CHEF')).post(`/api/taim/tables/${t1.id}/clean`).expect(403)

        await seat(host, t2).expect(201)
        const res = await host.post(`/api/taim/tables/${t2.id}/clean`).expect(409)
        expect(res.body.error).toBe('T2 still has guests')
        await host.post('/api/taim/tables/999/clean').expect(404)
    })
})

describe('fixing a seating mistake (seatTable)', () => {
    it('moves the guests to another table; the first one is free again', async () => {
        const order = (await seat(host, t1, 2).expect(201)).body
        const res = await host.patch(`/api/taim/orders/${order.id}`).send({ tableId: t2.id, guests: 3 }).expect(200)
        expect(res.body).toMatchObject({ table: { label: 'T2' }, guests: 3 })

        const tables = (await host.get('/api/taim/tables').expect(200)).body
        expect(tables.map((t) => [t.label, t.order?.id ?? null, t.needsCleaning])).toEqual([['T1', null, false], ['T2', order.id, false]])
    })

    it('cannot move onto a taken table or one that needs cleaning', async () => {
        const first = (await seat(host, t1).expect(201)).body
        const second = (await seat(host, t2).expect(201)).body
        const taken = await host.patch(`/api/taim/orders/${first.id}`).send({ tableId: t2.id }).expect(409)
        expect(taken.body.error).toBe('This table is already seated')

        await host.post(`/api/taim/orders/${second.id}/close`).expect(200)
        const dirty = await host.patch(`/api/taim/orders/${first.id}`).send({ tableId: t2.id }).expect(409)
        expect(dirty.body.error).toBe('T2 needs cleaning first')
    })

    it('cannot lower the guest count below a seat that has dishes', async () => {
        const order = (await seat(host, t2, 4).expect(201)).body
        await addDishes(waiter, order.id, [{ menuItemId: hummus.id, seat: 3 }]).expect(201)
        const res = await host.patch(`/api/taim/orders/${order.id}`).send({ guests: 2 }).expect(409)
        expect(res.body.error).toBe('Seat 3 has dishes: remove them or keep 3 guests')
        await host.patch(`/api/taim/orders/${order.id}`).send({ guests: 3 }).expect(200)
    })

    it('undoes a seating while nothing is ordered; after that it is a real bill', async () => {
        const order = (await seat(host).expect(201)).body
        await host.delete(`/api/taim/orders/${order.id}`).expect(204)
        const tables = (await host.get('/api/taim/tables').expect(200)).body
        expect(tables[0]).toMatchObject({ order: null, needsCleaning: false })

        const again = (await seat(host).expect(201)).body
        await addDishes(waiter, again.id, [{ menuItemId: hummus.id }]).expect(201)
        const res = await host.delete(`/api/taim/orders/${again.id}`).expect(409)
        expect(res.body.error).toMatch(/already has dishes/)
        await (await as('COOK')).delete(`/api/taim/orders/${again.id}`).expect(403)
    })

    it('a take-out cannot be moved to a table', async () => {
        const takeout = (await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya', customerPhone: '050-123-4567' }).expect(201)).body
        await host.patch(`/api/taim/orders/${takeout.id}`).send({ tableId: t1.id }).expect(409)
    })
})

describe('seat numbers on dishes', () => {
    it('saves which guest each dish is for; no seat = shared', async () => {
        const order = (await seat(host, t2, 3).expect(201)).body
        const res = await addDishes(waiter, order.id, [
            { menuItemId: hummus.id },
            { menuItemId: shakshuka.id, seat: 1 },
            { menuItemId: hummus.id, seat: 3, quantity: 2 },
        ]).expect(201)
        expect(res.body.items.map((i) => [i.name, i.seat])).toEqual([['Hummus', null], ['Shakshuka', 1], ['Hummus', 3], ['Hummus', 3]])
    })

    it('moves a dish to another seat or to shared, even after it was sent out', async () => {
        const order = (await seat(host, t2, 3).expect(201)).body
        const [dish] = (await addDishes(waiter, order.id, [{ menuItemId: hummus.id, seat: 1 }]).expect(201)).body.items
        await prisma.orderItem.update({ where: { id: dish.id }, data: { round: 1, status: 'SENT_OUT', sentOutAt: new Date() } })

        const url = `/api/taim/orders/${order.id}/items/${dish.id}`
        expect((await waiter.patch(url).send({ seat: 3 }).expect(200)).body.items[0].seat).toBe(3)
        expect((await waiter.patch(url).send({ seat: null }).expect(200)).body.items[0].seat).toBeNull()

        const bad = await waiter.patch(url).send({ seat: 4 }).expect(400)
        expect(bad.body.fields).toEqual({ seat: "Seat 4 doesn't exist: the table has 3 guests" })
        await waiter.patch(url).send({}).expect(400)
        await waiter.patch(`/api/taim/orders/${order.id}/items/999`).send({ seat: 1 }).expect(404)
        await host.patch(url).send({ seat: 2 }).expect(403)

        await host.post(`/api/taim/orders/${order.id}/close`).expect(200)
        await waiter.patch(url).send({ seat: 2 }).expect(409)
    })

    it('refuses a seat the table does not have, and seats on a take-out', async () => {
        const order = (await seat(host, t2, 3).expect(201)).body
        const res = await addDishes(waiter, order.id, [{ menuItemId: hummus.id, seat: 4 }]).expect(400)
        expect(res.body.fields).toEqual({ items: "Seat 4 doesn't exist: the table has 3 guests" })

        const takeout = (await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya', customerPhone: '050-123-4567' }).expect(201)).body
        const out = await addDishes(waiter, takeout.id, [{ menuItemId: hummus.id, seat: 1 }]).expect(400)
        expect(out.body.fields).toEqual({ items: 'Take-out dishes have no seat' })
        expect(await prisma.orderItem.count()).toBe(0)
    })
})

describe('sending to the kitchen (addDishes: Manager, Waiter)', () => {
    it('new dishes wait on the bill until the waiter sends them, all at once', async () => {
        const order = (await seat(host, t2, 3).expect(201)).body
        await addDishes(waiter, order.id, [{ menuItemId: hummus.id, seat: 1 }, { menuItemId: shakshuka.id, seat: 2 }]).expect(201)
        const tables = (await host.get('/api/taim/tables').expect(200)).body
        expect(tables[1].order).toMatchObject({ dishCount: 2, notSent: 2 })

        const res = await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
        expect(res.body.items.map((i) => [i.status, i.round])).toEqual([['PREPARING', 1], ['PREPARING', 1]])
        expect(res.body.items.every((i) => i.firedAt)).toBe(true)

        // the floor shows the food is coming: 2 in the kitchen, for seats 1 and 2
        const cooking = (await host.get('/api/taim/tables').expect(200)).body[1].order
        expect(cooking).toMatchObject({ notSent: 0, inKitchen: 2, waitingSeats: [1, 2], waitingSince: expect.any(String) })

        // a second round: only the new dish is sent
        await addDishes(waiter, order.id, [{ menuItemId: hummus.id, seat: 3 }]).expect(201)
        const again = await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
        expect(again.body.items.map((i) => i.round)).toEqual([1, 1, 2]) // the added dish is round 2

        // seat 1's dish is served; shared dishes come last in the waiting list
        await prisma.orderItem.update({ where: { id: again.body.items[0].id }, data: { round: 1, status: 'SENT_OUT', sentOutAt: new Date() } })
        await addDishes(waiter, order.id, [{ menuItemId: shakshuka.id }]).expect(201)
        const third = await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
        expect(third.body.items.map((i) => i.round)).toEqual([1, 1, 2, 3])
        const later = (await host.get('/api/taim/tables').expect(200)).body[1].order
        expect(later).toMatchObject({ inKitchen: 3, waitingSeats: [2, 3, null] })
    })

    it('nothing new → 409; a Host cannot send', async () => {
        const order = (await seat(host).expect(201)).body
        const nothing = await waiter.post(`/api/taim/orders/${order.id}/send`).expect(409)
        expect(nothing.body.error).toBe('Nothing new to send: add dishes first')
        await addDishes(waiter, order.id, [{ menuItemId: hummus.id }]).expect(201)
        await host.post(`/api/taim/orders/${order.id}/send`).expect(403)
    })

    it('the bill cannot be closed while dishes have not been sent', async () => {
        const order = (await seat(host).expect(201)).body
        await addDishes(waiter, order.id, [{ menuItemId: hummus.id, quantity: 2 }]).expect(201)
        const res = await host.post(`/api/taim/orders/${order.id}/close`).expect(409)
        expect(res.body.error).toBe("2 dishes haven't been sent to the kitchen: send or remove them first")
        expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('OPEN')

        await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
        const cooking = await host.post(`/api/taim/orders/${order.id}/close`).expect(409)
        expect(cooking.body.error).toBe('2 dishes are still in the kitchen: close the bill once everything is served')

        await serveAll(order.id)
        await host.post(`/api/taim/orders/${order.id}/close`).expect(200)
    })
})

describe('the database ties rounds to sending', () => {
    it('a dish not sent has no round; a sent one must have one', async () => {
        const order = (await seat(host).expect(201)).body
        const { items } = (await addDishes(waiter, order.id, [{ menuItemId: hummus.id }]).expect(201)).body
        expect(items[0].round).toBeNull()
        await expect(prisma.orderItem.update({ where: { id: items[0].id }, data: { round: 1 } })).rejects.toThrow(/order_items_round_when_sent/)
        await expect(prisma.orderItem.update({ where: { id: items[0].id }, data: { status: 'PREPARING' } })).rejects.toThrow(/order_items_round_when_sent/)
    })
})

describe('take-out orders (takeoutOrders: Manager, Host, Waiter)', () => {
    it('the Host takes a take-out from start to paid', async () => {
        const takeout = (await host.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya', customerPhone: '050-123-4567' }).expect(201)).body
        const { items } = (await addDishes(host, takeout.id, [{ menuItemId: hummus.id, quantity: 2 }]).expect(201)).body
        await host.delete(`/api/taim/orders/${takeout.id}/items/${items[1].id}`).expect(200)
        const sent = await host.post(`/api/taim/orders/${takeout.id}/send`).expect(200)
        expect(sent.body.items.map((i) => [i.status, i.round])).toEqual([['PREPARING', 1]])
        await serveAll(takeout.id)
        await host.post(`/api/taim/orders/${takeout.id}/close`).expect(200)
    })

    it('the Host still cannot change the dishes of a table', async () => {
        const order = (await seat(host).expect(201)).body
        await addDishes(host, order.id, [{ menuItemId: hummus.id }]).expect(403)
        const { items } = (await addDishes(waiter, order.id, [{ menuItemId: hummus.id }]).expect(201)).body
        await host.post(`/api/taim/orders/${order.id}/send`).expect(403)
        await host.patch(`/api/taim/orders/${order.id}/items/${items[0].id}`).send({ seat: 2 }).expect(403)
        await host.delete(`/api/taim/orders/${order.id}/items/${items[0].id}`).expect(403)
    })

    it('Cook and Chef cannot take take-out orders; an unknown order is 404', async () => {
        const takeout = (await host.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya', customerPhone: '050-123-4567' }).expect(201)).body
        for (const role of ['COOK', 'CHEF']) await addDishes(await as(role), takeout.id, [{ menuItemId: hummus.id }]).expect(403)
        await addDishes(host, 999, [{ menuItemId: hummus.id }]).expect(404)
    })
})

describe('combining tables (combineTables: Manager, Host)', () => {
    let t3
    beforeEach(async () => {
        t3 = await prisma.diningTable.create({ data: { label: 'T3', seats: 6, position: 3 } })
    })
    const combine = (agent, ...tables) => agent.post('/api/taim/tables/combine').send({ tableIds: tables.map((t) => t.id) })
    const floorOf = async () => (await host.get('/api/taim/tables').expect(200)).body

    it('joins free tables into one: first on the floor is the main table, seats add up', async () => {
        const res = await combine(host, t3, t1).expect(201)
        expect(res.body).toMatchObject({ id: t1.id, groupLabel: 'T1 + T3', groupSeats: 8, joined: [{ label: 'T3', seats: 6 }] })
        const floor = await floorOf()
        expect(floor.find((t) => t.label === 'T3').joinedToId).toBe(t1.id)
    })

    it('no more guests than the combined seats', async () => {
        await combine(host, t1, t3).expect(201) // 2 + 6 = 8 seats
        const res = await seat(host, t1, 9).expect(400)
        expect(res.body.fields).toEqual({ guests: 'T1 + T3 has 8 seats: seat up to 8 guests' })
        const order = (await seat(host, t1, 8).expect(201)).body
        await host.patch(`/api/taim/orders/${order.id}`).send({ guests: 9 }).expect(400)
    })

    it('the group is seated through its main table, with seats for everyone', async () => {
        await combine(host, t1, t3).expect(201)
        const joinedSeat = await seat(host, t3, 6).expect(409)
        expect(joinedSeat.body.error).toBe('T3 is combined with T1: seat T1 instead')

        const order = (await seat(host, t1, 8).expect(201)).body
        expect(order.table).toEqual({ id: t1.id, label: 'T1 + T3' })
        const res = await addDishes(waiter, order.id, [{ menuItemId: hummus.id, seat: 8 }]).expect(201)
        expect(res.body.items[0].seat).toBe(8)
    })

    it('closing the bill makes the whole group need cleaning; cleaning it splits it up', async () => {
        await combine(host, t1, t3).expect(201)
        const order = (await seat(host, t1, 8).expect(201)).body
        await host.post(`/api/taim/orders/${order.id}/close`).expect(200)
        expect((await floorOf()).filter((t) => t.needsCleaning).map((t) => t.label)).toEqual(['T1', 'T3'])

        await waiter.post(`/api/taim/tables/${t3.id}/clean`).expect(200) // any table of the group
        const floor = await floorOf()
        expect(floor.map((t) => [t.label, t.needsCleaning, t.joinedToId, t.groupSeats])).toEqual([
            ['T1', false, null, 2], ['T2', false, null, 4], ['T3', false, null, 6],
        ])
    })

    it('only free, clean, single tables can be combined', async () => {
        const one = await combine(host, t1).expect(400)
        expect(one.body.fields).toEqual({ tableIds: 'Pick at least two tables' })
        await host.post('/api/taim/tables/combine').send({ tableIds: [t1.id, 999] }).expect(400)

        await seat(host, t2).expect(201)
        expect((await combine(host, t1, t2).expect(409)).body.error).toBe('T2 has guests: only free tables can be combined')
        await host.post(`/api/taim/tables/${t3.id}/needs-cleaning`).expect(200)
        expect((await combine(host, t1, t3).expect(409)).body.error).toBe('T3 needs cleaning first')
        await waiter.post(`/api/taim/tables/${t3.id}/clean`).expect(200)

        await combine(host, t1, t3).expect(201)
        const t4 = await prisma.diningTable.create({ data: { label: 'T4', seats: 2, position: 4 } })
        expect((await combine(host, t3, t4).expect(409)).body.error).toBe('T3 is already combined')
    })

    it('splits back while nobody is seated; not while the party is there', async () => {
        await combine(host, t1, t3).expect(201)
        const order = (await seat(host, t1, 8).expect(201)).body
        expect((await host.post(`/api/taim/tables/${t1.id}/split`).expect(409)).body.error).toBe('T1 + T3 has guests: split it after they leave')

        await host.delete(`/api/taim/orders/${order.id}`).expect(204) // undo the seating
        const res = await host.post(`/api/taim/tables/${t3.id}/split`).expect(200)
        expect(res.body).toMatchObject({ label: 'T1', groupLabel: 'T1', groupSeats: 2, joined: [] })
        await host.post(`/api/taim/tables/${t1.id}/split`).expect(409) // not combined any more
    })

    it('Waiter and Cook cannot combine or split', async () => {
        await combine(waiter, t1, t3).expect(403)
        await combine(await as('COOK'), t1, t3).expect(403)
        await combine(await as('MANAGER'), t1, t3).expect(201)
        await waiter.post(`/api/taim/tables/${t1.id}/split`).expect(403)
    })

    it('the database refuses a table joined to itself', async () => {
        await expect(prisma.diningTable.update({ where: { id: t1.id }, data: { joinedToId: t1.id } })).rejects.toThrow(/dining_tables_not_joined_to_itself/)
    })
})

describe('no more guests than seats', () => {
    it('a single table: up to its own seats, when seating, changing guests or moving', async () => {
        const res = await seat(host, t1, 3).expect(400) // T1 has 2 seats
        expect(res.body.fields).toEqual({ guests: 'T1 has 2 seats: seat up to 2 guests' })

        const order = (await seat(host, t2, 4).expect(201)).body // T2 has 4
        await host.patch(`/api/taim/orders/${order.id}`).send({ guests: 5 }).expect(400)
        const move = await host.patch(`/api/taim/orders/${order.id}`).send({ tableId: t1.id }).expect(400)
        expect(move.body.fields).toEqual({ guests: 'T1 has 2 seats: seat up to 2 guests' })
        await host.patch(`/api/taim/orders/${order.id}`).send({ tableId: t1.id, guests: 2 }).expect(200)
    })
})

