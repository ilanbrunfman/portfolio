import { describe, it, expect, beforeEach } from 'vitest'
import supertest from 'supertest'
import { anonymous, resetTaim, as, app, prisma } from './helpers.js'

beforeEach(resetTaim)

describe('GET /api/taim/staff', () => {
    it('lists everyone to pick from, manager first, without logging in', async () => {
        const res = await anonymous.get('/api/taim/staff').expect(200)
        expect(res.body.map((s) => s.role)).toEqual(['MANAGER', 'CHEF', 'COOK', 'HOST', 'WAITER'])
        expect(res.body[0]).toEqual({ id: expect.any(Number), name: 'Noa', role: 'MANAGER' })
    })
})

describe('POST /api/taim/session (pick who you are)', () => {
    it('remembers the person in an httpOnly cookie for the Ta\'im API only', async () => {
        const avi = await prisma.staff.findFirstOrThrow({ where: { name: 'Avi' } })
        const res = await anonymous.post('/api/taim/session').send({ staffId: avi.id }).expect(200)

        expect(res.body.staff).toEqual({ id: avi.id, name: 'Avi', role: 'CHEF' })
        const cookie = res.headers['set-cookie'].join(';')
        expect(cookie).toMatch(/taim_staff=\d+/)
        expect(cookie).toMatch(/Path=\/api\/taim/)
        expect(cookie).toMatch(/HttpOnly/)
    })

    it('answers 404 for someone who does not exist', async () => {
        const res = await anonymous.post('/api/taim/session').send({ staffId: 999 }).expect(404)
        expect(res.body.error).toBe('Staff member not found')
    })

    it('answers 400 with a field message when staffId is missing or wrong', async () => {
        const missing = await anonymous.post('/api/taim/session').send({}).expect(400)
        expect(missing.body.fields).toEqual({ staffId: 'Pick a staff member' })
        await anonymous.post('/api/taim/session').send({ staffId: 'abc' }).expect(400)
        await anonymous.post('/api/taim/session').send({ staffId: -1 }).expect(400)
    })
})

describe('GET /api/taim/session', () => {
    it('answers 401 when nobody was picked', async () => {
        const res = await anonymous.get('/api/taim/session').expect(401)
        expect(res.body.error).toBe('Pick who you are first')
    })

    it('answers 401 for a cookie that is not a real staff member', async () => {
        await anonymous.get('/api/taim/session').set('Cookie', 'taim_staff=999').expect(401)
        await anonymous.get('/api/taim/session').set('Cookie', 'taim_staff=abc').expect(401)
    })

    it('returns the person with their rights and screens', async () => {
        const cook = await as('COOK')
        const res = await cook.get('/api/taim/session').expect(200)
        expect(res.body).toEqual({
            staff: { id: expect.any(Number), name: 'Yossi', role: 'COOK' },
            rights: ['advanceDish'],
            screens: ['kitchen'],
        })
    })

    it('gives the manager every screen and every right', async () => {
        const manager = await as('MANAGER')
        const res = await manager.get('/api/taim/session').expect(200)
        expect(res.body.screens).toEqual(['floor', 'order', 'kitchen', 'menu', 'losses'])
        expect(res.body.rights).toHaveLength(9)
    })
})

describe('DELETE /api/taim/session (switch person)', () => {
    it('forgets who was picked', async () => {
        const host = await as('HOST')
        await host.delete('/api/taim/session').expect(204)
        await host.get('/api/taim/session').expect(401)
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
