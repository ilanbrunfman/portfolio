import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'
import { lastDayEnd, autoCloseDay } from '../../src/projects/taim/services/days.js'

// The automatic close: at the set time (04:00, Asia/Jerusalem by default)
// the server closes the day if nobody did.

describe('lastDayEnd: the most recent 04:00 on the restaurant clock', () => {
    it('after 04:00 → today 04:00; before → yesterday 04:00 (winter, UTC+2)', () => {
        expect(lastDayEnd(new Date('2026-12-10T10:00:00Z'), '04:00', 'Asia/Jerusalem').toISOString()).toBe('2026-12-10T02:00:00.000Z')
        // 03:30 in Israel is 01:30 UTC: the day hasn't ended yet
        expect(lastDayEnd(new Date('2026-12-10T01:30:00Z'), '04:00', 'Asia/Jerusalem').toISOString()).toBe('2026-12-09T02:00:00.000Z')
    })

    it('follows summer time (UTC+3) and other zones and times', () => {
        expect(lastDayEnd(new Date('2026-07-01T12:00:00Z'), '04:00', 'Asia/Jerusalem').toISOString()).toBe('2026-07-01T01:00:00.000Z')
        expect(lastDayEnd(new Date('2026-07-01T12:00:00Z'), '02:30', 'UTC').toISOString()).toBe('2026-07-01T02:30:00.000Z')
        expect(lastDayEnd(new Date('2026-07-01T05:00:00Z'), '23:00', 'America/New_York').toISOString()).toBe('2026-07-01T03:00:00.000Z')
    })

    it('on the night the clocks change, uses the offset of that hour', () => {
        // Israel moves to summer time on Fri 27 Mar 2026 at 02:00. 00:30 that
        // night is still winter time (UTC+2): 22:30 UTC the evening before.
        expect(lastDayEnd(new Date('2026-03-27T12:00:00Z'), '00:30', 'Asia/Jerusalem').toISOString()).toBe('2026-03-26T22:30:00.000Z')
    })
})

describe('autoCloseDay', () => {
    let waiter, table, hummus
    // "Now" is the next morning at 10:00 Israel time; the day ended at 04:00 (02:00 UTC, winter)
    const now = new Date('2025-12-10T08:00:00Z')
    const dayEnd = new Date('2025-12-10T02:00:00Z')
    const at = (iso) => new Date(iso)

    beforeEach(async () => {
        await resetTaim()
        waiter = await as('WAITER')
        table = await prisma.diningTable.create({ data: { label: 'T1', seats: 4, position: 1 } })
        const category = await prisma.menuCategory.create({ data: { name: 'Mains', position: 1 } })
        hummus = await prisma.menuItem.create({ data: { categoryId: category.id, name: 'Hummus', price: 900, position: 1 } })
    })

    /** A bill opened at `openedAt`: closed (default) or still open */
    async function billAt(openedAt, { open = false } = {}) {
        const order = (await waiter.post('/api/taim/orders').send({ type: 'TAKEOUT', customerName: 'Maya' }).expect(201)).body
        await waiter.post(`/api/taim/orders/${order.id}/items`).send({ items: [{ menuItemId: hummus.id }] }).expect(201)
        await waiter.post(`/api/taim/orders/${order.id}/send`).expect(200)
        await prisma.orderItem.updateMany({ where: { orderId: order.id }, data: { status: 'SENT_OUT' } })
        if (!open) await waiter.post(`/api/taim/orders/${order.id}/close`).expect(200)
        await prisma.order.update({ where: { id: order.id }, data: { openedAt } })
        return order
    }

    it("closes last night's bills at 04:00, nobody named; a bill from after 04:00 waits for the next day", async () => {
        await billAt(at('2025-12-09T19:00:00Z'))
        await billAt(at('2025-12-09T23:30:00Z')) // 01:30 at night: still last night's day
        const morning = await billAt(at('2025-12-10T06:00:00Z'))

        const outcome = await autoCloseDay(now)
        expect(outcome.result).toBe('closed')
        expect(outcome.day).toMatchObject({ billCount: 2, sales: 1800, closedBy: null })
        expect(new Date(outcome.day.closedAt).toISOString()).toBe(dayEnd.toISOString())
        expect((await prisma.order.findUnique({ where: { id: morning.id } })).businessDayId).toBeNull()

        // The next check: nothing more to do
        expect((await autoCloseDay(now)).result).toBe('not-due')
    })

    it('waits while bills from before 04:00 are open, then closes once they are', async () => {
        await billAt(at('2025-12-09T19:00:00Z'))
        const late = await billAt(at('2025-12-09T23:00:00Z'), { open: true })

        expect(await autoCloseDay(now)).toEqual({ result: 'waiting', open: 1 })
        expect(await prisma.businessDay.count()).toBe(0)

        await waiter.post(`/api/taim/orders/${late.id}/close`).expect(200)
        expect((await autoCloseDay(now)).result).toBe('closed')
    })

    it('not due when someone closed the day by hand after 04:00, or there were no bills', async () => {
        expect((await autoCloseDay(now)).result).toBe('not-due') // no bills at all
        await billAt(at('2025-12-09T19:00:00Z'))
        const manager = await as('MANAGER')
        await manager.post('/api/taim/days/close').expect(201) // closed by hand (now, after 04:00)
        expect((await autoCloseDay(now)).result).toBe('not-due')
    })

    it('the Day view says when the automatic close is held back by open bills', async () => {
        await billAt(at('2020-01-01T19:00:00Z'), { open: true }) // long before the last 04:00
        const res = (await (await as('MANAGER')).get('/api/taim/bills?period=today').expect(200)).body
        expect(res.autoClose).toMatchObject({ at: '04:00', due: true, waiting: 1 })
    })
})

describe('zonedTime / restaurantToday: the restaurant clock', () => {
    it('turns a wall-clock time into the right instant, in winter and summer', async () => {
        const { zonedTime, restaurantToday } = await import('../../src/projects/taim/services/days.js')
        expect(zonedTime(2026, 9, 30, 4, 0, 'Asia/Jerusalem').toISOString()).toBe('2026-10-30T02:00:00.000Z')
        expect(zonedTime(2026, 6, 1, 12, 30, 'Asia/Jerusalem').toISOString()).toBe('2026-07-01T09:30:00.000Z')
        expect(zonedTime(2026, 9, 31, 26, 0, 'UTC').toISOString()).toBe('2026-11-01T02:00:00.000Z') // rolls over
        expect(restaurantToday(new Date('2026-10-30T23:30:00Z'), 'Asia/Jerusalem')).toEqual({ year: 2026, month: 9, day: 31, weekday: 6 })
    })
})
