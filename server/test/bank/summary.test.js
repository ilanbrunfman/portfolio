import { describe, it, expect, beforeEach } from 'vitest'
import { request, resetDb, createAccount, createCategory, createTransaction } from './helpers.js'

beforeEach(resetDb)

describe('GET /api/summary', () => {
    async function setup() {
        const checking = await createAccount({ name: 'Checking' })
        const savings = await createAccount({ name: 'Savings' })
        const rent = await createCategory({ name: 'Rent' })
        const food = await createCategory({ name: 'Food' })
        const salary = await createCategory({ name: 'Salary', kind: 'INCOME' })

        await createTransaction(checking.id, { date: '2026-10-01', amount: 300000, description: 'Payroll', categoryId: salary.id })
        await createTransaction(checking.id, { date: '2026-10-02', amount: -120000, description: 'Rent', categoryId: rent.id })
        await createTransaction(checking.id, { date: '2026-10-10', amount: -3000, description: 'Lunch', categoryId: food.id })
        await createTransaction(checking.id, { date: '2026-10-11', amount: -2000, description: 'Dinner', categoryId: food.id })
        await createTransaction(checking.id, { date: '2026-10-12', amount: -500, description: 'Mystery' }) // no category
        await createTransaction(checking.id, { date: '2026-09-15', amount: -7000, description: 'September', categoryId: food.id })
        // a transfer is neither income nor spending
        await request.post('/api/transfers').send({ fromAccountId: checking.id, toAccountId: savings.id, amount: 50000, date: '2026-10-05' }).expect(201)
        return { checking, savings }
    }

    it('totals one month, leaving transfers out', async () => {
        await setup()
        const { body } = await request.get('/api/summary').query({ month: '2026-10' }).expect(200)
        expect(body).toMatchObject({ month: '2026-10', income: 300000, spent: 125500, net: 174500 })
    })

    it('groups spending by category, biggest first, with Uncategorized', async () => {
        await setup()
        const { body } = await request.get('/api/summary').query({ month: '2026-10' }).expect(200)
        expect(body.byCategory.map((c) => [c.name, c.total, c.count])).toEqual([
            ['Rent', 120000, 1],
            ['Food', 5000, 2],
            ['Uncategorized', 500, 1],
        ])
    })

    it('returns 6 months of trend, with empty months as 0', async () => {
        await setup()
        const { body } = await request.get('/api/summary').query({ month: '2026-10' }).expect(200)
        expect(body.trend).toEqual([
            { month: '2026-05', income: 0, spent: 0 },
            { month: '2026-06', income: 0, spent: 0 },
            { month: '2026-07', income: 0, spent: 0 },
            { month: '2026-08', income: 0, spent: 0 },
            { month: '2026-09', income: 0, spent: 7000 },
            { month: '2026-10', income: 300000, spent: 125500 },
        ])
    })

    it('leaves archived accounts out', async () => {
        const { savings } = await setup()
        await createTransaction(savings.id, { date: '2026-10-20', amount: -99900, description: 'Big purchase' })
        await request.patch(`/api/accounts/${savings.id}`).send({ archived: true }).expect(200)

        const { body } = await request.get('/api/summary').query({ month: '2026-10' }).expect(200)
        expect(body.spent).toBe(125500)
    })

    it('validates the month', async () => {
        await request.get('/api/summary').query({ month: '2026-13' }).expect(400)
        const { body } = await request.get('/api/summary').expect(200)
        expect(body.month).toMatch(/^\d{4}-\d{2}$/) // defaults to this month
    })
})
