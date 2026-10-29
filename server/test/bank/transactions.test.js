import { describe, it, expect, beforeEach } from 'vitest'
import { request, resetDb, createAccount, createCategory, createTransaction } from './helpers.js'

beforeEach(resetDb)

describe('POST /api/transactions', () => {
    it('creates a transaction with its category (201)', async () => {
        const account = await createAccount()
        const groceries = await createCategory()
        const res = await request
            .post('/api/transactions')
            .send({ accountId: account.id, date: '2026-10-05', amount: -4250, description: ' Costco ', categoryId: groceries.id, note: '' })
            .expect(201)
        expect(res.body).toMatchObject({
            accountId: account.id,
            date: '2026-10-05',
            amount: -4250,
            description: 'Costco', // trimmed
            note: null, // empty note → null
            transferId: null,
            category: { id: groceries.id, name: 'Groceries', kind: 'EXPENSE' },
        })
    })

    it('validates date, amount and description', async () => {
        const account = await createAccount()
        const res = await request
            .post('/api/transactions')
            .send({ accountId: account.id, date: '10/01/2026', amount: 0, description: '' })
            .expect(400)
        expect(res.body.fields).toEqual({
            date: 'Use a date like 2026-10-22',
            amount: "Amount can't be zero",
            description: 'Description is required',
        })
    })

    it('rejects unknown accounts and categories (400) and archived accounts (409)', async () => {
        const account = await createAccount()
        await request.post('/api/transactions').send({ accountId: 999, date: '2026-10-01', amount: 1, description: 'x' })
            .expect(400).expect((res) => expect(res.body.fields).toEqual({ accountId: 'Unknown account' }))
        await request.post('/api/transactions').send({ accountId: account.id, date: '2026-10-01', amount: 1, description: 'x', categoryId: 999 })
            .expect(400).expect((res) => expect(res.body.fields).toEqual({ categoryId: 'Unknown category' }))

        await request.patch(`/api/accounts/${account.id}`).send({ archived: true }).expect(200)
        await request.post('/api/transactions').send({ accountId: account.id, date: '2026-10-01', amount: 1, description: 'x' }).expect(409)
    })
})

describe('PATCH and DELETE /api/transactions/:id', () => {
    it('updates some fields and clears the category with null', async () => {
        const account = await createAccount()
        const groceries = await createCategory()
        const t = await createTransaction(account.id, { categoryId: groceries.id })

        const res = await request.patch(`/api/transactions/${t.id}`).send({ amount: -3000, categoryId: null }).expect(200)
        expect(res.body).toMatchObject({ amount: -3000, description: 'Coffee', category: null })
    })

    it('refuses to edit one side of a transfer (409)', async () => {
        const a = await createAccount({ name: 'A' })
        const b = await createAccount({ name: 'B' })
        await request.post('/api/transfers').send({ fromAccountId: a.id, toAccountId: b.id, amount: 500, date: '2026-10-01' }).expect(201)
        const { body } = await request.get(`/api/accounts/${a.id}/transactions`).expect(200)
        await request.patch(`/api/transactions/${body.items[0].id}`).send({ amount: -1 }).expect(409)
    })

    it('deletes (204), then 404s', async () => {
        const account = await createAccount()
        const t = await createTransaction(account.id)
        await request.delete(`/api/transactions/${t.id}`).expect(204)
        await request.delete(`/api/transactions/${t.id}`).expect(404)
    })
})

describe('GET /api/accounts/:id/transactions (ledger)', () => {
    // Opening 100.00, then 5 rows on different days
    async function setup() {
        const account = await createAccount({ openingBalance: 10000 })
        const groceries = await createCategory()
        const salary = await createCategory({ name: 'Salary', kind: 'INCOME' })
        await createTransaction(account.id, { date: '2026-09-01', amount: 50000, description: 'Payroll', categoryId: salary.id })
        await createTransaction(account.id, { date: '2026-09-15', amount: -2000, description: 'Pizza place', categoryId: groceries.id })
        await createTransaction(account.id, { date: '2026-10-01', amount: -3000, description: '50% off sale' })
        await createTransaction(account.id, { date: '2026-10-02', amount: -1500, description: '500 bucks', note: 'pizza night' })
        await createTransaction(account.id, { date: '2026-10-03', amount: -1000, description: 'Coffee', categoryId: groceries.id })
        return { account, groceries }
    }

    it('lists newest first with the balance after each row', async () => {
        const { account } = await setup()
        const { body } = await request.get(`/api/accounts/${account.id}/transactions`).expect(200)

        expect(body.items.map((t) => [t.date, t.amount, t.runningBalance])).toEqual([
            ['2026-10-03', -1000, 52500],
            ['2026-10-02', -1500, 53500],
            ['2026-10-01', -3000, 55000],
            ['2026-09-15', -2000, 58000],
            ['2026-09-01', 50000, 60000],
        ])
        expect(body.nextCursor).toBeNull()
        expect(body.totals).toEqual({ count: 5, moneyIn: 50000, moneyOut: -7500 })
    })

    it('pages with a cursor: every row once, in order', async () => {
        const { account } = await setup()
        const seen = []
        let cursor = null
        do {
            const { body } = await request
                .get(`/api/accounts/${account.id}/transactions`)
                .query({ limit: 2, ...(cursor && { cursor }) })
                .expect(200)
            seen.push(...body.items.map((t) => t.description))
            cursor = body.nextCursor
        } while (cursor)
        expect(seen).toEqual(['Coffee', '500 bucks', '50% off sale', 'Pizza place', 'Payroll'])
    })

    it('filters, while keeping the real running balance', async () => {
        const { account, groceries } = await setup()
        const { body } = await request
            .get(`/api/accounts/${account.id}/transactions`)
            .query({ categoryId: groceries.id })
            .expect(200)
        expect(body.items.map((t) => [t.description, t.runningBalance])).toEqual([
            ['Coffee', 52500], // same balance as unfiltered, not a filtered total
            ['Pizza place', 58000],
        ])
        expect(body.totals).toEqual({ count: 2, moneyIn: 0, moneyOut: -3000 })
    })

    it('searches description and note, case-insensitively', async () => {
        const { account } = await setup()
        const { body } = await request.get(`/api/accounts/${account.id}/transactions`).query({ q: 'PIZZA' }).expect(200)
        expect(body.items.map((t) => t.description)).toEqual(['500 bucks', 'Pizza place']) // note match + description match
    })

    it('treats % and _ in a search as plain text', async () => {
        const { account } = await setup()
        const { body } = await request.get(`/api/accounts/${account.id}/transactions`).query({ q: '50%' }).expect(200)
        expect(body.items.map((t) => t.description)).toEqual(['50% off sale']) // not "500 bucks"
    })

    it('filters by type and date range', async () => {
        const { account } = await setup()
        const income = await request.get(`/api/accounts/${account.id}/transactions`).query({ type: 'income' }).expect(200)
        expect(income.body.items.map((t) => t.description)).toEqual(['Payroll'])

        const october = await request
            .get(`/api/accounts/${account.id}/transactions`)
            .query({ from: '2026-10-01', to: '2026-10-02' })
            .expect(200)
        expect(october.body.items.map((t) => t.date)).toEqual(['2026-10-02', '2026-10-01'])
    })

    it('rejects bad filters', async () => {
        const { account } = await setup()
        const res = await request.get(`/api/accounts/${account.id}/transactions`).query({ from: '2026-10-05', to: '2026-10-01', type: 'gift' }).expect(400)
        expect(Object.keys(res.body.fields).sort()).toEqual(['to', 'type'])
        await request.get('/api/accounts/999/transactions').expect(404)
    })
})

describe('POST /api/transfers validation', () => {
    it('reports "two different accounts" together with other field errors', async () => {
        const a = await createAccount()
        const res = await request.post('/api/transfers').send({ fromAccountId: a.id, toAccountId: a.id, amount: -5, date: 'x' }).expect(400)
        expect(Object.keys(res.body.fields).sort()).toEqual(['amount', 'date', 'toAccountId'])
    })
})
