import { describe, it, expect, beforeEach } from 'vitest'
import supertest from 'supertest'
import { anonymous, resetTaim, as, app, prisma, pinOf } from './helpers.js'

beforeEach(resetTaim)

describe('GET /api/taim/staff', () => {
    it('lists the people working here, manager first, with their demo PINs, without logging in', async () => {
        const res = await anonymous.get('/api/taim/staff').expect(200)
        expect(res.body.map((s) => s.role)).toEqual(['MANAGER', 'CHEF', 'COOK', 'HOST', 'WAITER'])
        expect(res.body[0]).toEqual({ id: expect.any(Number), name: 'Noa', role: 'MANAGER', demoPin: '1111' })
        expect(JSON.stringify(res.body)).not.toMatch(/pinHash|scrypt/)
    })

    it('leaves out someone who left', async () => {
        await prisma.staff.updateMany({ where: { name: 'Lior' }, data: { active: false } })
        const res = await anonymous.get('/api/taim/staff').expect(200)
        expect(res.body.map((s) => s.name)).not.toContain('Lior')
    })
})

describe('POST /api/taim/session (name + PIN, step 8.1)', () => {
    const avi = () => prisma.staff.findFirstOrThrow({ where: { name: 'Avi' } })
    let aviId
    beforeEach(async () => { aviId = (await avi()).id })
    const login = (pin, agent = anonymous) => agent.post('/api/taim/session').send({ staffId: aviId, pin })

    it('the right PIN starts a session: a random token in an httpOnly cookie for the Ta\'im API only', async () => {
        const res = await login(pinOf('Avi')).expect(200)
        expect(res.body.staff).toEqual({ id: expect.any(Number), name: 'Avi', role: 'CHEF' })
        const cookie = res.headers['set-cookie'].join(';')
        expect(cookie).toMatch(/taim_session=[\w-]{40,}/)
        expect(cookie).toMatch(/Path=\/api\/taim/)
        expect(cookie).toMatch(/HttpOnly/)
        // The database keeps only a hash of the token
        const [session] = await prisma.staffSession.findMany()
        expect(cookie).not.toContain(session.id)
    })

    it('a wrong PIN says how many tries are left; the 5th locks them for a minute, even with the right PIN', async () => {
        const first = await login('0000').expect(401)
        expect(first.body.error).toBe('Wrong PIN: 4 tries left')
        for (let i = 0; i < 3; i += 1) await login('0000').expect(401)
        const locked = await login('0000').expect(429)
        expect(locked.body.error).toBe('Too many wrong PINs: try again in 60 s')
        await login(pinOf('Avi')).expect(429)
        // A minute later the right PIN works, and the count starts again
        await prisma.staff.update({ where: { id: (await avi()).id }, data: { lockedUntil: new Date(Date.now() - 1000) } })
        await login(pinOf('Avi')).expect(200)
        expect((await avi()).failedPins).toBe(0)
    })

    it('someone who left, or has no PIN yet, cannot log in; 404 for nobody', async () => {
        const id = (await avi()).id
        await prisma.staff.update({ where: { id }, data: { pinHash: null } })
        expect((await login('2222').expect(409)).body.error).toBe('Avi has no PIN yet: ask the Manager to set one')
        await prisma.staff.update({ where: { id }, data: { active: false } })
        expect((await login('2222').expect(403)).body.error).toBe("Avi doesn't work here any more")
        await anonymous.post('/api/taim/session').send({ staffId: 999, pin: '1234' }).expect(404)
    })

    it('answers 400 with field messages for a missing person or a PIN that is not 4 digits', async () => {
        const missing = await anonymous.post('/api/taim/session').send({}).expect(400)
        expect(missing.body.fields).toEqual({ staffId: 'Pick a staff member', pin: 'Type the 4-digit PIN' })
        for (const pin of ['123', '12345', 'abcd', 1234]) await login(pin).expect(400)
    })
})

describe('GET /api/taim/session', () => {
    it('answers 401 when nobody was picked', async () => {
        const res = await anonymous.get('/api/taim/session').expect(401)
        expect(res.body.error).toBe('Pick who you are first')
    })

    it('answers 401 for a made-up or old cookie, an expired session, and someone who left', async () => {
        await anonymous.get('/api/taim/session').set('Cookie', 'taim_session=made-up').expect(401)
        await anonymous.get('/api/taim/session').set('Cookie', 'taim_staff=1').expect(401) // the old one (before PINs)
        const cook = await as('COOK')
        await prisma.staffSession.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } })
        await cook.get('/api/taim/session').expect(401)
        const host = await as('HOST')
        await prisma.staff.updateMany({ where: { role: 'HOST' }, data: { active: false } })
        await host.get('/api/taim/session').expect(401)
    })

    it('returns the person with their rights and screens', async () => {
        const cook = await as('COOK')
        const res = await cook.get('/api/taim/session').expect(200)
        expect(res.body).toEqual({
            staff: { id: expect.any(Number), name: 'Yossi', role: 'COOK' },
            rights: ['advanceDish'],
            screens: ['kitchen', 'clock'],
        })
    })

    it('the Chef sees the floor but can change nothing on it', async () => {
        const chef = await as('CHEF')
        const res = await chef.get('/api/taim/session').expect(200)
        expect(res.body.screens).toEqual(['floor', 'kitchen', 'menu', 'bills', 'losses', 'clock'])
        for (const right of ['seatTable', 'cleanTable', 'combineTables', 'setUpTables', 'closeBill', 'addDishes', 'takeoutOrders']) {
            expect(res.body.rights).not.toContain(right)
        }
        const table = await prisma.diningTable.create({ data: { label: 'T1', seats: 4, position: 1 } })
        await chef.get('/api/taim/tables').expect(200)
        await chef.post('/api/taim/orders').send({ type: 'TABLE', tableId: table.id, guests: 2 }).expect(403)
        await chef.post(`/api/taim/tables/${table.id}/needs-cleaning`).expect(403)
        await chef.post('/api/taim/tables').send({ label: 'T2', seats: 2 }).expect(403)
    })

    it('gives the manager every screen and every right except the kitchen ones (view only there)', async () => {
        const manager = await as('MANAGER')
        const res = await manager.get('/api/taim/session').expect(200)
        expect(res.body.screens).toEqual(['floor', 'order', 'kitchen', 'menu', 'bills', 'losses', 'staff', 'clock'])
        expect(res.body.rights).toHaveLength(15)
        expect(res.body.rights).not.toContain('advanceDish')
        expect(res.body.rights).not.toContain('fireHeld')
    })
})

describe('DELETE /api/taim/session (switch person)', () => {
    it('ends this device\'s session', async () => {
        const host = await as('HOST')
        await host.delete('/api/taim/session').expect(204)
        await host.get('/api/taim/session').expect(401)
        expect(await prisma.staffSession.count()).toBe(0)
    })
})

describe('Ta\'im and the bank are separate', () => {
    it('a bank login does not count as picking a Ta\'im person', async () => {
        // a unique email: this file doesn't empty the bank tables
        const agent = supertest.agent(app)
        await agent.post('/api/bank/auth/signup').send({ email: `taim-${Date.now()}@test.dev`, password: 'password123' }).expect(201)
        await agent.get('/api/taim/session').expect(401)
    })
})
