import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'

// Step 5.4: allergies. Dishes carry allergens; the waiter notes a guest's
// allergy on a seat (or the whole table / take-out); a clashing dish needs
// the waiter's confirmation; the kitchen taps Seen before it starts.
let waiter, cook, host, table, hummus, baklava, salad

beforeEach(async () => {
    await resetTaim()
    ;[waiter, cook, host] = await Promise.all(['WAITER', 'COOK', 'HOST'].map(as))
    table = await prisma.diningTable.create({ data: { label: 'T1', seats: 4, position: 1 } })
    const category = await prisma.menuCategory.create({ data: { versionId: 1, name: 'Mains', position: 1 } })
    ;[hummus, baklava, salad] = await Promise.all([
        prisma.menuItem.create({ data: { versionId: 1, categoryId: category.id, name: 'Hummus', price: 900, position: 1, allergens: ['SESAME'] } }),
        prisma.menuItem.create({ data: { versionId: 1, categoryId: category.id, name: 'Baklava', price: 800, position: 2, allergens: ['GLUTEN', 'TREE_NUTS'] } }),
        prisma.menuItem.create({ data: { versionId: 1, categoryId: category.id, name: 'Salad', price: 700, position: 3 } }),
    ])
})

const seatTable = async (guests = 3) => (await waiter.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests }).expect(201)).body
const note = (orderId, body, agent = waiter) => agent.put(`/api/taim/orders/${orderId}/allergies`).send(body)
const add = (orderId, items) => waiter.post(`/api/taim/orders/${orderId}/items`).send({ items })
const kitchen = async () => (await cook.get('/api/taim/kitchen').expect(200)).body

describe('noting an allergy on the bill', () => {
    it('a seat, or the whole table; changed, or removed when nothing is left', async () => {
        const order = await seatTable()
        let res = await note(order.id, { seat: 2, allergens: ['TREE_NUTS', 'PEANUTS'], note: ' severe ' }).expect(200)
        expect(res.body.allergies).toEqual([{ seat: 2, allergens: ['PEANUTS', 'TREE_NUTS'], note: 'severe', notedBy: 'Lior' }])

        await note(order.id, { seat: null, allergens: ['GLUTEN'] }).expect(200)
        res = await note(order.id, { seat: 2, allergens: ['SESAME'] }).expect(200)
        expect(res.body.allergies).toEqual([
            { seat: 2, allergens: ['SESAME'], note: null, notedBy: 'Lior' },
            { seat: null, allergens: ['GLUTEN'], note: null, notedBy: 'Lior' },
        ])
        res = await note(order.id, { seat: 2, allergens: [], note: '' }).expect(200)
        expect(res.body.allergies.map((row) => row.seat)).toEqual([null])
    })

    it('only seats that exist; a take-out has the whole-order row only; the Host and Cook cannot at a table', async () => {
        const order = await seatTable(2)
        expect((await note(order.id, { seat: 3, allergens: ['EGG'] }).expect(400)).body.fields).toEqual({ seat: "Seat 3 doesn't exist: the table has 2 guests" })
        await note(order.id, { seat: 1, allergens: ['WHEAT'] }).expect(400)
        await note(order.id, { seat: 1, allergens: ['EGG'] }, host).expect(403)
        await note(order.id, { seat: 1, allergens: ['EGG'] }, cook).expect(403)

        const takeout = (await host.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya' }).expect(201)).body
        await note(takeout.id, { seat: 1, allergens: ['EGG'] }, host).expect(400)
        expect((await note(takeout.id, { allergens: ['EGG'] }, host).expect(200)).body.allergies).toHaveLength(1)
    })

    it('fewer guests than a seat with an allergy is refused', async () => {
        const order = await seatTable(3)
        await note(order.id, { seat: 3, allergens: ['EGG'] }).expect(200)
        const res = await waiter.patch(`/api/taim/orders/${order.id}`).send({ guests: 2 }).expect(409)
        expect(res.body.error).toBe('Seat 3 has an allergy noted: remove it or keep 3 guests')
    })

    it('the database keeps one row per seat (one whole-table row too) and refuses an empty one', async () => {
        const order = await seatTable()
        const staff = await prisma.staff.findFirstOrThrow()
        await prisma.seatAllergy.create({ data: { orderId: order.id, seat: null, allergens: ['EGG'], notedById: staff.id } })
        await expect(prisma.seatAllergy.create({ data: { orderId: order.id, seat: null, allergens: ['FISH'], notedById: staff.id } })).rejects.toThrow()
        await expect(prisma.seatAllergy.create({ data: { orderId: order.id, seat: 1, allergens: [], notedById: staff.id } })).rejects.toThrow(/seat_allergies_valid/)
    })
})

describe('a dish that clashes', () => {
    it('is refused with a warning unless the waiter confirms; then it is marked', async () => {
        const order = await seatTable()
        await note(order.id, { seat: 2, allergens: ['TREE_NUTS'] }).expect(200)

        const res = await add(order.id, [{ menuItemId: baklava.id, seat: 2 }]).expect(409)
        expect(res.body.error).toBe('Baklava contains tree nuts: Seat 2 is allergic. Confirm to add it anyway.')
        await add(order.id, [{ menuItemId: baklava.id, seat: 1 }, { menuItemId: hummus.id, seat: 2 }]).expect(201) // no clash

        const confirmed = (await add(order.id, [{ menuItemId: baklava.id, seat: 2, allergyConfirmed: true }]).expect(201)).body
        const last = confirmed.items.at(-1)
        expect(last).toMatchObject({ name: 'Baklava', seat: 2, allergens: ['GLUTEN', 'TREE_NUTS'], clash: ['TREE_NUTS'], allergyConfirmed: true })
        expect(confirmed.items[0]).toMatchObject({ clash: [], allergyConfirmed: false })
    })

    it('a shared dish clashes with anyone at the table; the whole-table allergy with every seat', async () => {
        const order = await seatTable()
        await note(order.id, { seat: 3, allergens: ['SESAME'] }).expect(200)
        expect((await add(order.id, [{ menuItemId: hummus.id, seat: null }]).expect(409)).body.error).toBe('Hummus contains sesame: someone at the table is allergic. Confirm to add it anyway.')
        await note(order.id, { seat: null, allergens: ['GLUTEN'] }).expect(200)
        await add(order.id, [{ menuItemId: baklava.id, seat: 1 }]).expect(409)
        await add(order.id, [{ menuItemId: salad.id, seat: 1 }]).expect(201)
    })

    it('moving a dish to a seat it clashes with needs the same confirmation', async () => {
        const order = await seatTable()
        await note(order.id, { seat: 2, allergens: ['TREE_NUTS'] }).expect(200)
        const item = (await add(order.id, [{ menuItemId: baklava.id, seat: 1 }]).expect(201)).body.items[0]
        await waiter.patch(`/api/taim/orders/${order.id}/items/${item.id}`).send({ seat: 2 }).expect(409)
        const res = await waiter.patch(`/api/taim/orders/${order.id}/items/${item.id}`).send({ seat: 2, allergyConfirmed: true }).expect(200)
        expect(res.body.items[0]).toMatchObject({ seat: 2, clash: ['TREE_NUTS'], allergyConfirmed: true })
    })

    it('the floor card counts the allergies on the bill', async () => {
        const order = await seatTable()
        await note(order.id, { seat: 1, allergens: ['EGG'] }).expect(200)
        await note(order.id, { seat: null, note: 'no pork' }).expect(200)
        const tables = (await waiter.get('/api/taim/tables').expect(200)).body
        expect(tables[0].order.allergies).toBe(2)
    })
})

describe('the kitchen', () => {
    /** Seat 2 is allergic to tree nuts; a ticket with dishes for seats 1 and 2, sent */
    async function sentWithAllergy() {
        const order = await seatTable()
        await note(order.id, { seat: 2, allergens: ['TREE_NUTS'], note: 'severe' }).expect(200)
        await add(order.id, [{ menuItemId: salad.id, seat: 1 }, { menuItemId: baklava.id, seat: 2, allergyConfirmed: true }]).expect(201)
        await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
        return order
    }

    it('sees the allergy on the ticket, must tap Seen before Start or Served', async () => {
        const order = await sentWithAllergy()
        const [ticket] = (await kitchen()).tickets
        expect(ticket.allergies).toEqual([{ seat: 2, allergens: ['TREE_NUTS'], note: 'severe' }])
        expect(ticket.allergySeen).toBeNull()
        expect(ticket.dishes.find((dish) => dish.name === 'Baklava').clash).toEqual(['TREE_NUTS'])

        const start = await cook.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(409)
        expect(start.body.error).toBe('Allergy on this ticket: tap Seen first. Seat 2: tree nuts (severe)')
        await cook.post(`/api/taim/order-items/${ticket.dishes[0].id}/serve`).expect(409)

        await cook.post(`/api/taim/orders/${order.id}/rounds/1/allergy-seen`).expect(204)
        expect((await kitchen()).tickets[0].allergySeen).toEqual({ at: expect.any(String), by: 'Yossi' })
        await cook.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(204)
        await cook.post(`/api/taim/order-items/${ticket.dishes[0].id}/serve`).expect(204)
    })

    it('a change to the allergies while cooking needs Seen again', async () => {
        const order = await sentWithAllergy()
        await cook.post(`/api/taim/orders/${order.id}/rounds/1/allergy-seen`).expect(204)
        await note(order.id, { seat: 1, allergens: ['GLUTEN'] }).expect(200)
        const [ticket] = (await kitchen()).tickets
        expect(ticket.allergySeen).toBeNull()
        expect(ticket.allergies).toHaveLength(2)
        await cook.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(409)
    })

    it('a ticket without allergies for its seats needs no tap; Waiters cannot tap Seen', async () => {
        const order = await seatTable()
        await note(order.id, { seat: 2, allergens: ['TREE_NUTS'] }).expect(200)
        await add(order.id, [{ menuItemId: salad.id, seat: 1 }]).expect(201)
        await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
        const [ticket] = (await kitchen()).tickets
        expect(ticket).toMatchObject({ allergies: [], allergySeen: null })
        await waiter.post(`/api/taim/orders/${order.id}/rounds/1/allergy-seen`).expect(403)
        await cook.post(`/api/taim/orders/${order.id}/rounds/1/start`).expect(204)
    })
})

describe('a dish that came back for an allergy', () => {
    it('needs a note saying what happened', async () => {
        const order = await seatTable()
        const item = (await add(order.id, [{ menuItemId: salad.id, seat: 1 }]).expect(201)).body.items[0]
        await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
        await cook.post(`/api/taim/order-items/${item.id}/serve`).expect(204)
        const res = await waiter.post(`/api/taim/orders/${order.id}/items/${item.id}/came-back`).send({ reason: 'ALLERGY' }).expect(400)
        expect(res.body.fields).toEqual({ note: 'Say what happened (the allergy, how the guest is)' })
        await waiter.post(`/api/taim/orders/${order.id}/items/${item.id}/came-back`).send({ reason: 'ALLERGY', note: 'sesame in the dressing' }).expect(201)
    })
})
