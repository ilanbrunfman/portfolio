import { describe, it, expect, beforeEach } from 'vitest'
import { request, resetDb, createAccount, createTransaction } from './helpers.js'

beforeEach(resetDb)

describe('POST /api/accounts', () => {
    it('creates an account with defaults (201)', async () => {
        const res = await request.post('/api/accounts').send({ name: '  Everyday  ' }).expect(201)
        expect(res.body).toMatchObject({
            id: 1,
            name: 'Everyday', // trimmed
            type: 'CHECKING',
            openingBalance: 0,
            balance: 0,
            transactionCount: 0,
            archived: false,
        })
    })

    it('returns a message per invalid field (400)', async () => {
        const res = await request.post('/api/accounts').send({ name: '', type: 'GOLD', openingBalance: 12.5 }).expect(400)
        expect(res.body).toEqual({
            error: 'Validation failed',
            fields: {
                name: 'Name is required',
                type: 'Type must be one of CHECKING, SAVINGS, CREDIT, CASH',
                openingBalance: 'Use whole cents',
            },
        })
    })
})

describe('GET /api/accounts', () => {
    it('computes balance = opening balance + transactions', async () => {
        const account = await createAccount({ openingBalance: 10000 })
        await createTransaction(account.id, { amount: -2500 })
        await createTransaction(account.id, { amount: 1000 })

        const res = await request.get('/api/accounts').expect(200)
        expect(res.body).toHaveLength(1)
        expect(res.body[0]).toMatchObject({ balance: 8500, transactionCount: 2 })
    })

    it('hides archived accounts unless includeArchived=true', async () => {
        await createAccount({ name: 'Open' })
        const old = await createAccount({ name: 'Old' })
        await request.patch(`/api/accounts/${old.id}`).send({ archived: true }).expect(200)

        const active = await request.get('/api/accounts').expect(200)
        expect(active.body.map((a) => a.name)).toEqual(['Open'])

        const all = await request.get('/api/accounts?includeArchived=true').expect(200)
        expect(all.body.map((a) => a.name)).toEqual(['Open', 'Old'])
    })
})

describe('GET /api/accounts/:id', () => {
    it('404s for a missing account and 400s for a bad id', async () => {
        await request.get('/api/accounts/999').expect(404, { error: 'Account not found' })
        await request.get('/api/accounts/abc').expect(400)
    })
})

describe('PATCH /api/accounts/:id', () => {
    it('changes only the fields sent', async () => {
        const account = await createAccount({ name: 'Old name', type: 'SAVINGS', color: '#123456' })
        const res = await request.patch(`/api/accounts/${account.id}`).send({ name: 'New name' }).expect(200)
        expect(res.body).toMatchObject({ name: 'New name', type: 'SAVINGS', color: '#123456' })
    })

    it('rejects an empty update and a missing account', async () => {
        const account = await createAccount()
        await request.patch(`/api/accounts/${account.id}`).send({}).expect(400)
        await request.patch('/api/accounts/999').send({ name: 'x' }).expect(404)
    })
})
