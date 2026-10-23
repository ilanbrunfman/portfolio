import { describe, it, expect, beforeEach } from 'vitest'
import supertest from 'supertest'
import app from '../src/app.js'
import { request, anonymous, resetDb, signUp, PASSWORD, prisma, createAccount, createTransaction } from './helpers.js'

beforeEach(resetDb)

describe('sign up, log in, log out', () => {
    it('signs up (201), sets an httpOnly cookie, and stores only a hash', async () => {
        const res = await anonymous.post('/api/auth/signup').send({ email: '  New@Example.com ', password: 'longenough' }).expect(201)
        expect(res.body).toEqual({ user: { id: expect.any(Number), email: 'new@example.com' } })

        const cookie = res.headers['set-cookie'][0]
        expect(cookie).toMatch(/^bank_session=/)
        expect(cookie).toMatch(/HttpOnly/)
        expect(cookie).toMatch(/Path=\/api/)

        const user = await prisma.user.findUnique({ where: { email: 'new@example.com' } })
        expect(user.passwordHash).toMatch(/^scrypt\$/)
        expect(user.passwordHash).not.toContain('longenough')
    })

    it('validates email and password, and refuses a taken email (409)', async () => {
        const res = await anonymous.post('/api/auth/signup').send({ email: 'nope', password: 'short' }).expect(400)
        expect(res.body.fields).toEqual({ email: 'Enter a valid email', password: 'Use at least 8 characters' })
        await anonymous.post('/api/auth/signup').send({ email: 'OWNER@test.dev', password: PASSWORD }).expect(409)
    })

    it('logs in with the right password, and gives one message for any failure', async () => {
        const agent = supertest.agent(app)
        await agent.post('/api/auth/login').send({ email: 'owner@test.dev', password: PASSWORD }).expect(200)
        await agent.get('/api/auth/me').expect(200, { user: { id: 1, email: 'owner@test.dev' } })

        const wrongPassword = await anonymous.post('/api/auth/login').send({ email: 'owner@test.dev', password: 'wrongpass' }).expect(401)
        const unknownEmail = await anonymous.post('/api/auth/login').send({ email: 'ghost@test.dev', password: 'wrongpass' }).expect(401)
        expect(wrongPassword.body).toEqual(unknownEmail.body) // doesn't reveal which emails exist
    })

    it('logs out: the session is gone', async () => {
        await request.get('/api/auth/me').expect(200)
        await request.post('/api/auth/logout').expect(204)
        await request.get('/api/auth/me').expect(401)
        expect(await prisma.session.count()).toBe(0)
    })

    it('rejects an expired session', async () => {
        await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } })
        await request.get('/api/accounts').expect(401)
    })
})

describe('protected routes', () => {
    it('answer 401 without a login', async () => {
        for (const path of ['/api/accounts', '/api/categories', '/api/summary', '/api/accounts/1/transactions']) {
            const res = await anonymous.get(path).expect(401)
            expect(res.body).toEqual({ error: 'Please log in' })
        }
        await anonymous.post('/api/transactions').send({}).expect(401)
        await anonymous.get('/api/health').expect(200) // public
    })
})

describe("users can't see or touch each other's data", () => {
    it('isolates accounts, transactions, transfers and the summary', async () => {
        // owner (request) has an account with a transaction
        const mine = await createAccount({ name: 'Mine', openingBalance: 50000 })
        const tx = await createTransaction(mine.id, { amount: -1234 })

        const other = await signUp('other@test.dev')
        const theirs = (await other.post('/api/accounts').send({ name: 'Theirs' }).expect(201)).body

        // the other user sees only their own account…
        const list = await other.get('/api/accounts').expect(200)
        expect(list.body.map((a) => a.name)).toEqual(['Theirs'])

        // …and gets 404 for the owner's things, as if they didn't exist
        await other.get(`/api/accounts/${mine.id}`).expect(404)
        await other.patch(`/api/accounts/${mine.id}`).send({ name: 'Hacked' }).expect(404)
        await other.get(`/api/accounts/${mine.id}/transactions`).expect(404)
        await other.patch(`/api/transactions/${tx.id}`).send({ amount: -1 }).expect(404)
        await other.delete(`/api/transactions/${tx.id}`).expect(404)

        // can't add to the owner's account or move money out of it
        await other.post('/api/transactions').send({ accountId: mine.id, date: '2026-10-01', amount: -1, description: 'x' }).expect(400)
        await other.post('/api/transfers').send({ fromAccountId: mine.id, toAccountId: theirs.id, amount: 100, date: '2026-10-01' }).expect(400)

        // summary only counts their own spending
        const summary = await other.get('/api/summary').query({ month: '2026-10' }).expect(200)
        expect(summary.body.spent).toBe(0)

        // and the owner's data is untouched
        const after = await request.get(`/api/accounts/${mine.id}`).expect(200)
        expect(after.body).toMatchObject({ name: 'Mine', balance: 50000 - 1234 })
    })

    it("can't read or delete someone else's transfer", async () => {
        const a = await createAccount({ name: 'A', openingBalance: 1000 })
        const b = await createAccount({ name: 'B' })
        const { body } = await request.post('/api/transfers').send({ fromAccountId: a.id, toAccountId: b.id, amount: 100, date: '2026-10-01' }).expect(201)

        const other = await signUp('other@test.dev')
        await other.get(`/api/transfers/${body.transferId}`).expect(404)
        await other.patch(`/api/transfers/${body.transferId}`).send({ amount: 1 }).expect(404)
        await other.delete(`/api/transfers/${body.transferId}`).expect(404)
        await request.get(`/api/transfers/${body.transferId}`).expect(200) // still there
    })
})
