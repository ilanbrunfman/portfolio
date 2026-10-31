import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'

// Reviewing bills (Manager, Chef, Host) and closing the day (Manager, Chef)
let manager, chef, host, waiter, t1, t2, hummus, kebab

beforeEach(async () => {
    await resetTaim()
    ;[manager, chef, host, waiter] = await Promise.all(['MANAGER', 'CHEF', 'HOST', 'WAITER'].map(as))
    ;[t1, t2] = await Promise.all([
        prisma.diningTable.create({ data: { label: 'T1', seats: 4, position: 1 } }),
        prisma.diningTable.create({ data: { label: 'T2', seats: 4, position: 2 } }),
    ])
    const category = await prisma.menuCategory.create({ data: { versionId: 1, name: 'Mains', position: 1 } })
    ;[hummus, kebab] = await Promise.all([
        prisma.menuItem.create({ data: { versionId: 1, categoryId: category.id, name: 'Hummus', price: 900, position: 1 } }),
        prisma.menuItem.create({ data: { versionId: 1, categoryId: category.id, name: 'Kebab', price: 1700, position: 2 } }),
    ])
})

/** A bill with these dishes, served; closed unless open = true */
async function bill({ table, guests = 2, dishes = [hummus], takeout, open = false }) {
    const body = takeout ? { type: 'TAKEOUT', customerName: takeout } : { type: 'TABLE', tableId: table.id, guests }
    const order = (await waiter.post('/api/taim/orders').send(body).expect(201)).body
    await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: dishes.map((dish) => ({ menuItemId: dish.id })) }).expect(201)
    await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
    await prisma.orderItem.updateMany({ where: { orderId: order.id }, data: { status: 'SENT_OUT', sentOutAt: new Date() } })
    if (!open) {
        await waiter.post(`/api/taim/orders/${order.id}/close`).expect(200)
        // the table needs cleaning after; clean it so the next test bill can sit there
        if (table) await waiter.post(`/api/taim/tables/${table.id}/clean`).expect(200)
    }
    return order
}

const today = async (agent = manager, query = '') => (await agent.get(`/api/taim/bills?period=today${query}`).expect(200)).body

describe('GET /api/taim/bills', () => {
    it("today: every bill since the last close, newest first, with totals (sales = closed bills only)", async () => {
        await bill({ table: t1, guests: 3, dishes: [hummus, kebab] }) // $26
        await bill({ takeout: 'Maya', dishes: [kebab] }) // $17
        await bill({ table: t2, guests: 2, open: true }) // open, $9

        const res = await today()
        expect(res.since).toBeNull() // never closed yet
        expect(res.bills.map((b) => [b.title, b.status, b.total, b.dishCount])).toEqual([
            ['T2', 'OPEN', 900, 1],
            ['Take-out · Maya', 'CLOSED', 1700, 1],
            ['T1', 'CLOSED', 2600, 2],
        ])
        expect(res.totals).toEqual({ bills: 3, open: 1, closed: 2, tableBills: 2, takeoutBills: 1, guests: 5, sales: 4300, averageBill: 2150 })
        expect(res.bills[0].openedBy.name).toBeTruthy()
    })

    it('status narrows the list, not the totals', async () => {
        await bill({ table: t1 })
        await bill({ table: t2, open: true })
        const res = await today(manager, '&status=OPEN')
        expect(res.bills.map((b) => b.title)).toEqual(['T2'])
        expect(res.totals.bills).toBe(2)
    })

    it('from: bills opened since then, and the days closed in that time', async () => {
        await bill({ table: t1 })
        await manager.post('/api/taim/days/close').expect(201)
        const old = await bill({ table: t2 })
        await prisma.order.update({ where: { id: old.id }, data: { openedAt: new Date('2020-01-01') } })

        const res = (await chef.get(`/api/taim/bills?from=${new Date(Date.now() - 86_400_000).toISOString()}`).expect(200)).body
        expect(res.bills.map((b) => b.title)).toEqual(['T1'])
        expect(res.days).toHaveLength(1)
        expect(res.days[0]).toMatchObject({ billCount: 1, sales: 900, closedBy: { name: expect.any(String) } })
    })

    it('Manager, Chef and Host can review; a Waiter or Cook cannot', async () => {
        await host.get('/api/taim/bills?period=today').expect(200)
        await chef.get('/api/taim/bills?period=today').expect(200)
        await waiter.get('/api/taim/bills?period=today').expect(403)
        await (await as('COOK')).get('/api/taim/bills?period=today').expect(403)
    })

    it('needs either period=today or from', async () => {
        const res = await manager.get('/api/taim/bills').expect(400)
        expect(res.body.fields._).toBe('Give either period=today or from')
        await manager.get('/api/taim/bills?from=not-a-date').expect(400)
    })
})

describe('POST /api/taim/days/close', () => {
    it("saves the day's report and locks its bills; today starts again", async () => {
        await bill({ table: t1, guests: 3, dishes: [hummus, kebab] })
        await bill({ takeout: 'Maya', dishes: [kebab] })

        const day = (await chef.post('/api/taim/days/close').expect(201)).body
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/) // the restaurant date it belongs to
        expect(day).toMatchObject({ billCount: 2, tableBills: 1, takeoutBills: 1, guests: 3, sales: 4300, cameBack: 0, cameBackValue: 0, closedBy: { name: expect.any(String) } })
        expect(await prisma.order.count({ where: { businessDayId: day.id } })).toBe(2)

        const after = await today()
        expect(after.bills).toEqual([])
        expect(new Date(after.since).getTime()).toBe(new Date(day.closedAt).getTime())
    })

    it('the next day starts where the last one closed', async () => {
        await bill({ table: t1 })
        const first = (await manager.post('/api/taim/days/close').expect(201)).body
        await bill({ table: t1 })
        const second = (await manager.post('/api/taim/days/close').expect(201)).body
        expect(second.openedAt).toBe(first.closedAt)
    })

    it('counts dishes that came back as a loss, not as sales', async () => {
        const order = await bill({ table: t1, dishes: [hummus, kebab], open: true })
        await prisma.orderItem.updateMany({ where: { orderId: order.id, menuItemId: kebab.id }, data: { status: 'CAME_BACK' } })
        await waiter.post(`/api/taim/orders/${order.id}/close`).expect(200)
        const day = (await manager.post('/api/taim/days/close').expect(201)).body
        expect(day).toMatchObject({ sales: 900, cameBack: 1, cameBackValue: 1700 })
    })

    it('refused while bills are open, naming them', async () => {
        await bill({ table: t1 })
        await bill({ table: t2, open: true })
        await bill({ takeout: 'Maya', open: true })
        const res = await manager.post('/api/taim/days/close').expect(409)
        expect(res.body.error).toBe('2 bills are still open: T2, Take-out · Maya. Close them first.')
        expect(await prisma.businessDay.count()).toBe(0)
    })

    it('refused when there is nothing to close', async () => {
        const res = await manager.post('/api/taim/days/close').expect(409)
        expect(res.body.error).toBe('No bills since the last close: nothing to close')
    })

    it('two closes at once make one day', async () => {
        await bill({ table: t1 })
        const results = await Promise.all([manager, chef].map((agent) => agent.post('/api/taim/days/close')))
        expect(results.map((r) => r.status).sort()).toEqual([201, 409])
        expect(await prisma.businessDay.count()).toBe(1)
    })

    it('only the Manager and Chef can close the day', async () => {
        await bill({ table: t1 })
        await host.post('/api/taim/days/close').expect(403)
        await waiter.post('/api/taim/days/close').expect(403)
    })

    it('the database refuses an open bill in a closed day, and a report that does not add up', async () => {
        await bill({ table: t1 })
        const day = (await manager.post('/api/taim/days/close').expect(201)).body
        const open = await bill({ table: t2, open: true })
        await expect(prisma.order.update({ where: { id: open.id }, data: { businessDayId: day.id } })).rejects.toThrow()
        await expect(prisma.businessDay.update({ where: { id: day.id }, data: { tableBills: 5 } })).rejects.toThrow()
    })
})
