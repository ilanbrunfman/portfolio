import { describe, it, expect, beforeEach } from 'vitest'
import { resetTaim, as, prisma } from './helpers.js'
import { closeForgotten } from '../../src/projects/taim/services/timeClock.js'

// Step 8.2: the time clock. Everyone clocks in/out and takes breaks
// (unpaid); everyone fixes their own entries, the Manager and Host anyone's;
// every fix needs a reason and is logged.
let waiter, host, cook, lior, yossi

beforeEach(async () => {
    await resetTaim()
    ;[waiter, host, cook] = await Promise.all(['WAITER', 'HOST', 'COOK'].map(as))
    lior = await prisma.staff.findFirstOrThrow({ where: { name: 'Lior' } })
    yossi = await prisma.staff.findFirstOrThrow({ where: { name: 'Yossi' } })
})

const ago = (minutes) => new Date(Date.now() - minutes * 60_000)
/** An entry for someone, `from` → `to` minutes ago (to null = still open), with breaks [[from, to]] */
const entry = (staffId, from, to, breaks = []) =>
    prisma.timeEntry.create({
        data: { staffId, clockIn: ago(from), clockOut: to === null ? null : ago(to), breaks: { create: breaks.map(([a, b]) => ({ startAt: ago(a), endAt: b === null ? null : ago(b) })) } },
    })
const week = { from: ago(7 * 24 * 60).toISOString(), to: new Date(Date.now() + 60_000).toISOString() }
const sheet = (agent, query = {}) => agent.get('/api/taim/timesheets').query({ ...week, ...query })

describe('clocking in and out', () => {
    it('in, a break, out: one open entry at a time, and each step only when it makes sense', async () => {
        const res = await waiter.post('/api/taim/clock/in').expect(200)
        expect(res.body.entry).toMatchObject({ open: true, onBreak: false, staff: { name: 'Lior' } })
        expect((await waiter.post('/api/taim/clock/in').expect(409)).body.error).toBe("You're already clocked in")

        expect((await waiter.post('/api/taim/clock/break-start').expect(200)).body.entry.onBreak).toBe(true)
        expect((await waiter.post('/api/taim/clock/break-start').expect(409)).body.error).toBe("You're on a break already")
        await waiter.post('/api/taim/clock/break-end').expect(200)
        await waiter.post('/api/taim/clock/break-end').expect(409)

        const out = await waiter.post('/api/taim/clock/out').expect(200)
        expect(out.body.entry).toBeNull()
        expect((await waiter.post('/api/taim/clock/out').expect(409)).body.error).toBe("You're not clocked in")
        expect((await waiter.post('/api/taim/clock/break-start').expect(409)).body.error).toBe('Clock in first')
    })

    it('clocking out ends a break that is still running', async () => {
        await entry(lior.id, 60, null, [[20, null]])
        await waiter.post('/api/taim/clock/out').expect(200)
        const [b] = await prisma.timeBreak.findMany()
        expect(b.endAt).not.toBeNull()
    })

    it('the database refuses a second open entry, overlapping entries and a clock-out before the clock-in', async () => {
        await entry(lior.id, 300, 200)
        await expect(entry(lior.id, 250, 100)).rejects.toThrow(/time_entries_no_overlap/)
        await entry(lior.id, 100, null)
        await expect(entry(lior.id, 50, null)).rejects.toThrow()
        await expect(prisma.timeEntry.create({ data: { staffId: yossi.id, clockIn: ago(10), clockOut: ago(20) } })).rejects.toThrow(/time_entries_times/)
        await entry(yossi.id, 250, 100) // someone else may overlap Lior, of course
    })
})

describe('timesheets', () => {
    it('worked time is clocked time minus breaks (unpaid), newest first', async () => {
        await entry(lior.id, 600, 120, [[400, 370]]) // 8 h, a 30 min break
        await entry(lior.id, 60, null) // working now
        const res = await sheet(waiter).expect(200)
        expect(res.body.staff.name).toBe('Lior')
        expect(res.body.entries.map((e) => [e.workedMinutes, e.breakMinutes, e.open])).toEqual([[60, 0, true], [450, 30, false]])
        expect(res.body).toMatchObject({ workedMinutes: 510, breakMinutes: 30, forgot: 0 })
    })

    it('staff see only their own; the Manager and Host see anyone\'s', async () => {
        const other = await sheet(waiter, { staffId: yossi.id }).expect(403)
        expect(other.body.error).toBe('You can only see your own timesheet')
        await sheet(host, { staffId: yossi.id }).expect(200)
        await sheet(await as('MANAGER'), { staffId: lior.id }).expect(200)
        await sheet(cook, { staffId: lior.id }).expect(403)
    })

    it('who\'s on now: for the Manager and Host only', async () => {
        await entry(lior.id, 90, null, [[10, null]])
        await entry(yossi.id, 30, null)
        const res = await host.get('/api/taim/clock').expect(200)
        expect(res.body.onNow.map((e) => [e.staff.name, e.onBreak])).toEqual([['Lior', true], ['Yossi', false]])
        expect((await waiter.get('/api/taim/clock').expect(200)).body.onNow).toBeUndefined()
    })
})

describe('everyone\'s hours (Manager, Host)', () => {
    it('one row per person working here with worked hours, breaks, days and flags, plus the totals', async () => {
        await entry(lior.id, 600, 120, [[400, 370]]) // 450 worked, 30 break
        await entry(lior.id, 60, null) // working now: 60
        await entry(yossi.id, 300, 60) // 240
        await prisma.timeEntry.updateMany({ where: { staffId: yossi.id }, data: { forgot: true } })
        const res = await host.get('/api/taim/timesheets/team').query(week).expect(200)
        expect(res.body.people.map((p) => p.staff.name)).toEqual(['Noa', 'Avi', 'Yossi', 'Dana', 'Lior'])
        const byName = Object.fromEntries(res.body.people.map((p) => [p.staff.name, p]))
        expect(byName.Lior).toMatchObject({ workedMinutes: 510, breakMinutes: 30, entries: 2, on: true, forgot: 0 })
        expect(byName.Yossi).toMatchObject({ workedMinutes: 240, entries: 1, days: 1, forgot: 1, on: false })
        expect(byName.Noa).toMatchObject({ workedMinutes: 0, entries: 0, days: 0 })
        expect(res.body).toMatchObject({ workedMinutes: 750, breakMinutes: 30, forgot: 1 })
    })

    it('someone who left shows only with entries in the period; staff get 403', async () => {
        await prisma.staff.updateMany({ where: { name: 'Dana' }, data: { active: false } })
        await entry(lior.id, 300, 200)
        const manager = await as('MANAGER')
        expect((await manager.get('/api/taim/timesheets/team').query(week).expect(200)).body.people.map((p) => p.staff.name)).not.toContain('Dana')
        await (await as('CHEF')).get('/api/taim/timesheets/team').query(week).expect(403)
        await waiter.get('/api/taim/timesheets/team').query(week).expect(403)
    })
})

describe('fixing an entry', () => {
    const fix = (agent, id, body) => agent.patch(`/api/taim/time-entries/${id}`).send(body)

    it('anyone fixes their own, with a reason: logged with before and after, marked edited', async () => {
        const e = await entry(lior.id, 600, 300)
        const clockIn = ago(620).toISOString()
        const clockOut = ago(120).toISOString()
        const res = await fix(waiter, e.id, { clockIn, clockOut, breaks: [{ startAt: ago(400).toISOString(), endAt: ago(370).toISOString() }], reason: ' forgot to clock out ' }).expect(200)
        expect(res.body).toMatchObject({ edited: true, workedMinutes: 470, breakMinutes: 30 })
        const edits = (await waiter.get(`/api/taim/time-entries/${e.id}/edits`).expect(200)).body
        expect(edits).toHaveLength(1)
        expect(edits[0]).toMatchObject({ reason: 'forgot to clock out', editedBy: { name: 'Lior' }, after: { clockOut } })
        expect(edits[0].before.clockOut).toBe(e.clockOut.toISOString()) // what it was before the fix
    })

    it('a reason is optional: a fix without one is still logged (who, before / after)', async () => {
        const e = await entry(lior.id, 600, 300)
        await fix(waiter, e.id, { clockIn: ago(600).toISOString(), clockOut: ago(240).toISOString() }).expect(200)
        await fix(waiter, e.id, { clockIn: ago(600).toISOString(), clockOut: ago(230).toISOString(), reason: '  ' }).expect(200)
        const edits = (await waiter.get(`/api/taim/time-entries/${e.id}/edits`).expect(200)).body
        expect(edits.map((row) => [row.reason, row.editedBy.name])).toEqual([[null, 'Lior'], [null, 'Lior']])
    })

    it('times in the wrong order, the future or a break outside: refused', async () => {
        const e = await entry(lior.id, 600, 300)
        const base = { clockIn: ago(600).toISOString(), clockOut: ago(300).toISOString(), reason: 'fix' }
        expect((await fix(waiter, e.id, { ...base, clockOut: ago(700).toISOString() }).expect(400)).body.fields).toEqual({ clockOut: 'Clock-out must be after clock-in' })
        expect((await fix(waiter, e.id, { ...base, clockOut: new Date(Date.now() + 3_600_000).toISOString() }).expect(400)).body.fields).toEqual({ clockOut: "Clock-out can't be in the future" })
        expect((await fix(waiter, e.id, { ...base, breaks: [{ startAt: ago(800).toISOString(), endAt: ago(790).toISOString() }] }).expect(400)).body.fields).toEqual({ breaks: 'A break must be inside the clocked time' })
        expect((await fix(waiter, e.id, { ...base, clockOut: null }).expect(400)).body.fields).toEqual({ clockOut: 'Clock-out is required' })
    })

    it('times that overlap another entry of the same person are refused', async () => {
        await entry(lior.id, 1000, 700)
        const e = await entry(lior.id, 600, 300)
        const res = await fix(waiter, e.id, { clockIn: ago(800).toISOString(), clockOut: ago(300).toISOString(), reason: 'fix' }).expect(409)
        expect(res.body.error).toBe('These times overlap another entry of the same person')
    })

    it('someone else\'s entry: only the Manager or Host', async () => {
        const e = await entry(yossi.id, 600, 300)
        const body = { clockIn: ago(610).toISOString(), clockOut: ago(300).toISOString(), reason: 'came in earlier' }
        expect((await fix(waiter, e.id, body).expect(403)).body.error).toBe('You can only change your own entries')
        await waiter.get(`/api/taim/time-entries/${e.id}/edits`).expect(403)
        const res = await fix(host, e.id, body).expect(200)
        expect(res.body.edited).toBe(true)
        expect((await host.get(`/api/taim/time-entries/${e.id}/edits`)).body[0].editedBy.name).toBe('Dana')
        await fix(host, 999, body).expect(404)
    })

    it('an entry added by hand (forgot to clock in at all): your own, or anyone\'s for the Manager and Host', async () => {
        const body = { clockIn: ago(500).toISOString(), clockOut: ago(200).toISOString(), breaks: [{ startAt: ago(400).toISOString(), endAt: ago(380).toISOString() }], reason: 'forgot to clock in' }
        const res = await waiter.post('/api/taim/time-entries').send(body).expect(201)
        expect(res.body).toMatchObject({ staff: { name: 'Lior' }, edited: true, workedMinutes: 280 })
        expect((await waiter.get(`/api/taim/time-entries/${res.body.id}/edits`)).body[0].before).toBeNull()
        await waiter.post('/api/taim/time-entries').send({ ...body, staffId: yossi.id }).expect(403)
        await host.post('/api/taim/time-entries').send({ ...body, staffId: yossi.id }).expect(201)
    })
})

describe('clocking someone in from a time (#44)', () => {
    it('the Manager or Host adds a running entry for someone: they\'re on the clock from then', async () => {
        const res = await host.post('/api/taim/time-entries').send({ staffId: yossi.id, clockIn: ago(90).toISOString(), reason: 'Forgot to clock in' }).expect(201)
        expect(res.body).toMatchObject({ staff: { name: 'Yossi' }, open: true, clockOut: null, edited: true, workedMinutes: 90 })
        expect((await host.get('/api/taim/clock').expect(200)).body.onNow.map((e) => e.staff.name)).toEqual(['Yossi'])
        expect((await cook.get('/api/taim/clock').expect(200)).body.entry).toMatchObject({ open: true })
        // …and he clocks out as usual
        await cook.post('/api/taim/clock/out').expect(200)
        expect((await host.get(`/api/taim/time-entries/${res.body.id}/edits`).expect(200)).body[0]).toMatchObject({ editedBy: { name: 'Dana' }, reason: 'Forgot to clock in', before: null })
    })

    it('refused when they\'re already clocked in, or the start is in the future; staff only for themselves', async () => {
        await entry(yossi.id, 30, null)
        expect((await host.post('/api/taim/time-entries').send({ staffId: yossi.id, clockIn: ago(90).toISOString() }).expect(409)).body.error).toBe('Yossi is already clocked in')
        expect((await host.post('/api/taim/time-entries').send({ staffId: lior.id, clockIn: new Date(Date.now() + 600_000).toISOString() }).expect(400)).body.fields).toEqual({ clockIn: "Clock-in can't be in the future" })
        await waiter.post('/api/taim/time-entries').send({ staffId: yossi.id, clockIn: ago(60).toISOString() }).expect(403)
        await waiter.post('/api/taim/time-entries').send({ clockIn: ago(60).toISOString() }).expect(201) // his own
    })

    it('"I started at…": clock in yourself from earlier today – logged, so the Manager sees it', async () => {
        const res = await waiter.post('/api/taim/clock/in').send({ at: ago(45).toISOString() }).expect(200)
        expect(res.body.entry).toMatchObject({ open: true, edited: true })
        expect(res.body.entry.workedMinutes).toBeGreaterThanOrEqual(44)
        const edits = (await waiter.get(`/api/taim/time-entries/${res.body.entry.id}/edits`).expect(200)).body
        expect(edits[0]).toMatchObject({ editedBy: { name: 'Lior' }, reason: 'Clocked in from an earlier time' })
    })

    it('not in the future, not more than 16 hours back; clocking in now is not logged', async () => {
        expect((await waiter.post('/api/taim/clock/in').send({ at: new Date(Date.now() + 600_000).toISOString() }).expect(400)).body.fields).toEqual({ at: "Start can't be in the future" })
        await waiter.post('/api/taim/clock/in').send({ at: ago(17 * 60).toISOString() }).expect(400)
        const now = await waiter.post('/api/taim/clock/in').send({}).expect(200)
        expect(now.body.entry.edited).toBe(false)
        expect(await prisma.timeEdit.count()).toBe(0)
    })
})

describe('a forgotten clock-out', () => {
    it('is closed at the end of the day, flagged; an entry started after it stays open; a fix clears the flag', async () => {
        const dayEnd = ago(120)
        const forgotten = await entry(lior.id, 900, null, [[300, null]])
        const after = await entry(yossi.id, 60, null)
        expect(await closeForgotten(dayEnd)).toBe(1)

        const closed = await prisma.timeEntry.findUniqueOrThrow({ where: { id: forgotten.id }, include: { breaks: true } })
        expect(closed).toMatchObject({ clockOut: dayEnd, forgot: true })
        expect(closed.breaks[0].endAt).toEqual(dayEnd)
        expect((await prisma.timeEntry.findUniqueOrThrow({ where: { id: after.id } })).clockOut).toBeNull()
        expect((await sheet(waiter).expect(200)).body.forgot).toBe(1)

        const fixed = await waiter.patch(`/api/taim/time-entries/${forgotten.id}`).send({ clockIn: ago(900).toISOString(), clockOut: ago(420).toISOString(), reason: 'left at 22:00' }).expect(200)
        expect(fixed.body).toMatchObject({ forgot: false, edited: true })
    })
})
