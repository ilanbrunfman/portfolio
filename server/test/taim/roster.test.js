import { describe, it, expect, beforeEach } from 'vitest'
import supertest from 'supertest'
import { anonymous, resetTaim, as, app, prisma, pinOf } from './helpers.js'

// Step 8.1: the roster – the Manager keeps it: people, roles, phone, rate,
// start date, active or not, and their PIN.
let manager

beforeEach(async () => {
    await resetTaim()
    manager = await as('MANAGER')
})

const idOf = async (name) => (await prisma.staff.findFirstOrThrow({ where: { name } })).id
const loginAs = (staffId, pin) => supertest.agent(app).post('/api/taim/session').send({ staffId, pin })
const newPerson = (overrides = {}) => ({ name: 'Shira', role: 'WAITER', phone: '050-123-4567', hourlyRate: 3600, startDate: '2026-11-01', pin: '7777', ...overrides })

describe('GET /api/taim/roster (Manager only)', () => {
    it('lists everyone with role, phone, rate and start date – never the PIN', async () => {
        const res = await manager.get('/api/taim/roster').expect(200)
        expect(res.body.map((p) => p.name)).toEqual(['Noa', 'Avi', 'Yossi', 'Dana', 'Lior'])
        expect(res.body[0]).toEqual({
            id: expect.any(Number), name: 'Noa', role: 'MANAGER', phone: '050-111-2233', hourlyRate: 6500, startDate: '2024-03-01',
            active: true, hasPin: true, demoPin: true, lockedUntil: null, createdAt: expect.any(String),
        })
        expect(JSON.stringify(res.body)).not.toMatch(/pinHash|scrypt/)
    })

    it('the Chef and everyone else get 403 (rates are pay information)', async () => {
        for (const role of ['CHEF', 'COOK', 'HOST', 'WAITER']) await (await as(role)).get('/api/taim/roster').expect(403)
        await anonymous.get('/api/taim/roster').expect(401)
    })
})

describe('adding a person', () => {
    it('saves them with a hashed PIN; they appear on "Who are you?" and can log in', async () => {
        const res = await manager.post('/api/taim/roster').send(newPerson({ name: ' Shira ', phone: '' })).expect(201)
        expect(res.body).toMatchObject({ name: 'Shira', role: 'WAITER', phone: null, hourlyRate: 3600, startDate: '2026-11-01', active: true, hasPin: true, demoPin: false })
        const picker = (await anonymous.get('/api/taim/staff').expect(200)).body
        expect(picker.find((p) => p.name === 'Shira')).toMatchObject({ role: 'WAITER', demoPin: null })
        await loginAs(res.body.id, '7777').expect(200)
    })

    it('a PIN someone working here already has is refused (the tablet must know who typed it)', async () => {
        const res = await manager.post('/api/taim/roster').send(newPerson({ pin: pinOf('Avi') })).expect(409)
        expect(res.body.fields).toEqual({ pin: 'Someone else has this PIN: pick another' })
    })

    it('checks every field', async () => {
        const res = await manager.post('/api/taim/roster').send({ name: ' ', role: 'BOSS', hourlyRate: -1, startDate: 'soon', pin: '12', phone: 'call me' }).expect(400)
        expect(res.body.fields).toEqual({
            name: 'Name is required',
            role: 'Pick a role',
            hourlyRate: "Rate can't be negative",
            startDate: 'Start date must be a date (YYYY-MM-DD)',
            pin: 'The PIN is 4 digits',
            phone: 'Digits, spaces, + - ( ) only',
        })
        await (await as('CHEF')).post('/api/taim/roster').send(newPerson()).expect(403)
    })
})

describe('changing a person', () => {
    it('changes role, rate and phone', async () => {
        const res = await manager.patch(`/api/taim/roster/${await idOf('Lior')}`).send({ role: 'HOST', hourlyRate: 3900, phone: null }).expect(200)
        expect(res.body).toMatchObject({ role: 'HOST', hourlyRate: 3900, phone: null })
        await manager.patch('/api/taim/roster/999').send({ name: 'X' }).expect(404)
        await manager.patch(`/api/taim/roster/${await idOf('Lior')}`).send({}).expect(400)
    })

    it('someone who left is logged out everywhere, off the picker, and cannot log in', async () => {
        const lior = await as('WAITER')
        await manager.patch(`/api/taim/roster/${await idOf('Lior')}`).send({ active: false }).expect(200)
        await lior.get('/api/taim/session').expect(401)
        expect((await anonymous.get('/api/taim/staff')).body.map((p) => p.name)).not.toContain('Lior')
        await loginAs(await idOf('Lior'), pinOf('Lior')).expect(403)
        // still on the roster, after the people working here
        expect((await manager.get('/api/taim/roster')).body.at(-1)).toMatchObject({ name: 'Lior', active: false })
    })

    it('coming back needs a new PIN (the old one may be someone else\'s by now)', async () => {
        const id = await idOf('Lior')
        await manager.patch(`/api/taim/roster/${id}`).send({ active: false }).expect(200)
        const back = await manager.patch(`/api/taim/roster/${id}`).send({ active: true }).expect(200)
        expect(back.body).toMatchObject({ active: true, hasPin: false })
        await loginAs(id, pinOf('Lior')).expect(409)
    })

    it('there is always an active Manager, and you cannot mark yourself as left', async () => {
        const noa = await idOf('Noa')
        expect((await manager.patch(`/api/taim/roster/${noa}`).send({ active: false }).expect(409)).body.error).toBe("You can't mark yourself as left")
        expect((await manager.patch(`/api/taim/roster/${noa}`).send({ role: 'CHEF' }).expect(409)).body.error).toBe("Ta'im needs at least one active Manager")
        // With a second Manager, Noa can become a Chef
        await manager.patch(`/api/taim/roster/${await idOf('Dana')}`).send({ role: 'MANAGER' }).expect(200)
        await manager.patch(`/api/taim/roster/${noa}`).send({ role: 'CHEF' }).expect(200)
    })
})

describe('setting a PIN', () => {
    it('the new PIN works, the old one not; the demo PIN is gone; their other sessions end', async () => {
        const id = await idOf('Lior')
        const lior = await as('WAITER')
        await manager.put(`/api/taim/roster/${id}/pin`).send({ pin: '9090' }).expect(204)
        await lior.get('/api/taim/session').expect(401)
        await loginAs(id, pinOf('Lior')).expect(401)
        await loginAs(id, '9090').expect(200)
        expect((await anonymous.get('/api/taim/staff')).body.find((p) => p.name === 'Lior').demoPin).toBeNull()
    })

    it('lifts a lock; refuses someone else\'s PIN, someone who left, and anyone but the Manager', async () => {
        const id = await idOf('Lior')
        await prisma.staff.update({ where: { id }, data: { lockedUntil: new Date(Date.now() + 60_000), failedPins: 0 } })
        await manager.put(`/api/taim/roster/${id}/pin`).send({ pin: '9090' }).expect(204)
        await loginAs(id, '9090').expect(200)
        await manager.put(`/api/taim/roster/${id}/pin`).send({ pin: pinOf('Noa') }).expect(409)
        // Setting your own PIN keeps you logged in on this device
        await manager.put(`/api/taim/roster/${await idOf('Noa')}/pin`).send({ pin: '8181' }).expect(204)
        await manager.get('/api/taim/session').expect(200)
        await prisma.staff.update({ where: { id }, data: { active: false } })
        await manager.put(`/api/taim/roster/${id}/pin`).send({ pin: '6060' }).expect(409)
        await (await as('CHEF')).put(`/api/taim/roster/${id}/pin`).send({ pin: '6060' }).expect(403)
    })
})
