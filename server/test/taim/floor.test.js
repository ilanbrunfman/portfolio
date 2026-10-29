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
    const category = await prisma.menuCategory.create({ data: { name: 'Mains', position: 1 } })
    ;[hummus, shakshuka, schnitzel] = await Promise.all([
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Hummus', price: 900, position: 1 } }),
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Shakshuka', price: 1400, position: 2 } }),
        prisma.menuItem.create({ data: { categoryId: category.id, name: 'Schnitzel', price: 1800, position: 3, hidden: true } }),
    ])
})

const seat = (agent, table = t1, guests = 2) => agent.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests })
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

    it('starts a take-out with a name and no table', async () => {
        const res = await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: '  Maya ' }).expect(201)
        expect(res.body).toMatchObject({ type: 'TAKEOUT', table: null, guests: null, customerName: 'Maya' })
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
        await anonymous.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Bob' }).expect(401)
    })
})

describe('adding dishes (addDishes: Manager, Waiter)', () => {
    it('adds one row per dish, with the menu price copied in', async () => {
        const order = (await seat(host).expect(201)).body
        const res = await addDishes(waiter, order.id, [{ menuItemId: hummus.id, quantity: 2 }, { menuItemId: shakshuka.id }]).expect(201)

        expect(res.body.items.map((i) => [i.name, i.price, i.status])).toEqual([
            ['Hummus', 900, 'PREPARING'], ['Hummus', 900, 'PREPARING'], ['Shakshuka', 1400, 'PREPARING'],
        ])
        expect(res.body.total).toBe(3200)
    })

    it('keeps the old price on the bill when the menu price changes later', async () => {
        const order = (await seat(host).expect(201)).body
        await addDishes(waiter, order.id, [{ menuItemId: shakshuka.id }]).expect(201)
        await (await as('CHEF')).patch(`/api/taim/menu-items/${shakshuka.id}`).send({ price: 1500 }).expect(200)
        await addDishes(waiter, order.id, [{ menuItemId: shakshuka.id }]).expect(201)

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

    it('removes a dish still being prepared, but not one already sent out', async () => {
        const order = (await seat(host).expect(201)).body
        const { items } = (await addDishes(waiter, order.id, [{ menuItemId: hummus.id, quantity: 2 }]).expect(201)).body
        await prisma.orderItem.update({ where: { id: items[1].id }, data: { status: 'SENT_OUT', sentOutAt: new Date() } })

        const res = await waiter.delete(`/api/taim/orders/${order.id}/items/${items[0].id}`).expect(200)
        expect(res.body.items).toHaveLength(1)
        const sent = await waiter.delete(`/api/taim/orders/${order.id}/items/${items[1].id}`).expect(409)
        expect(sent.body.error).toMatch(/still being prepared/)
        await waiter.delete(`/api/taim/orders/${order.id}/items/999`).expect(404)
    })
})

describe('closing the bill (closeBill: Manager, Host, Waiter)', () => {
    it('closes the order and frees the table; the total leaves out dishes that came back', async () => {
        const order = (await seat(host).expect(201)).body
        const { items } = (await addDishes(waiter, order.id, [{ menuItemId: hummus.id }, { menuItemId: shakshuka.id }]).expect(201)).body
        await prisma.orderItem.update({ where: { id: items[1].id }, data: { status: 'CAME_BACK' } })

        const res = await host.post(`/api/taim/orders/${order.id}/close`).expect(200)
        expect(res.body).toMatchObject({ status: 'CLOSED', total: 900, closedAt: expect.any(String) })

        const tables = await host.get('/api/taim/tables').expect(200)
        expect(tables.body[0]).toMatchObject({ order: null, needsCleaning: true })
    })

    it('a closed bill cannot be closed again; open and closed lists', async () => {
        const order = (await seat(host).expect(201)).body
        await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya' }).expect(201)
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
        const takeout = (await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya' }).expect(201)).body
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

    it('refuses a seat the table does not have, and seats on a take-out', async () => {
        const order = (await seat(host, t2, 3).expect(201)).body
        const res = await addDishes(waiter, order.id, [{ menuItemId: hummus.id, seat: 4 }]).expect(400)
        expect(res.body.fields).toEqual({ items: "Seat 4 doesn't exist: the table has 3 guests" })

        const takeout = (await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya' }).expect(201)).body
        const out = await addDishes(waiter, takeout.id, [{ menuItemId: hummus.id, seat: 1 }]).expect(400)
        expect(out.body.fields).toEqual({ items: 'Take-out dishes have no seat' })
        expect(await prisma.orderItem.count()).toBe(0)
    })
})
