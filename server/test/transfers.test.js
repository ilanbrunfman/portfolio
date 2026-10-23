import { describe, it, expect, beforeEach } from 'vitest'
import { randomUUID } from 'node:crypto'
import { request, resetDb, createAccount, prisma } from './helpers.js'

beforeEach(resetDb)

const balance = async (id) => (await request.get(`/api/accounts/${id}`).expect(200)).body.balance
const transfer = (body) => request.post('/api/transfers').send({ date: '2026-10-01', ...body })

describe('transfers', () => {
    it('moves money: out of one account, into the other', async () => {
        const a = await createAccount({ name: 'A', openingBalance: 100000 })
        const b = await createAccount({ name: 'B' })
        const res = await transfer({ fromAccountId: a.id, toAccountId: b.id, amount: 25000 }).expect(201)

        expect(res.body).toMatchObject({ fromAccountId: a.id, toAccountId: b.id, amount: 25000, description: 'Transfer' })
        expect(await balance(a.id)).toBe(75000)
        expect(await balance(b.id)).toBe(25000)

        // Both rows share the transferId and point at each other in the ledger
        const ledger = (await request.get(`/api/accounts/${a.id}/transactions`).expect(200)).body.items
        expect(ledger[0]).toMatchObject({ amount: -25000, transferId: res.body.transferId, counterpartAccountId: b.id })
    })

    it('edits both sides at once, including moving to another account', async () => {
        const a = await createAccount({ name: 'A', openingBalance: 100000 })
        const b = await createAccount({ name: 'B' })
        const c = await createAccount({ name: 'C' })
        const { body } = await transfer({ fromAccountId: a.id, toAccountId: b.id, amount: 25000 }).expect(201)

        await request.patch(`/api/transfers/${body.transferId}`).send({ amount: 30000, toAccountId: c.id }).expect(200)
        expect([await balance(a.id), await balance(b.id), await balance(c.id)]).toEqual([70000, 0, 30000])

        const fetched = await request.get(`/api/transfers/${body.transferId}`).expect(200)
        expect(fetched.body).toMatchObject({ fromAccountId: a.id, toAccountId: c.id, amount: 30000 })
    })

    it('deletes both sides (from either endpoint)', async () => {
        const a = await createAccount({ name: 'A', openingBalance: 100000 })
        const b = await createAccount({ name: 'B' })
        const first = (await transfer({ fromAccountId: a.id, toAccountId: b.id, amount: 100 }).expect(201)).body
        const second = (await transfer({ fromAccountId: a.id, toAccountId: b.id, amount: 200 }).expect(201)).body

        await request.delete(`/api/transfers/${first.transferId}`).expect(204)
        // deleting one side through /api/transactions removes the other side too
        const side = await prisma.transaction.findFirst({ where: { transferId: second.transferId } })
        await request.delete(`/api/transactions/${side.id}`).expect(204)

        expect(await prisma.transaction.count()).toBe(0)
        expect(await balance(a.id)).toBe(100000)
        await request.get(`/api/transfers/${first.transferId}`).expect(404)
    })

    it('rejects same account, unknown account (400) and archived account (409)', async () => {
        const a = await createAccount({ name: 'A' })
        const b = await createAccount({ name: 'B' })
        await transfer({ fromAccountId: a.id, toAccountId: a.id, amount: 1 }).expect(400)
        await transfer({ fromAccountId: a.id, toAccountId: 999, amount: 1 })
            .expect(400).expect((res) => expect(res.body.fields).toEqual({ toAccountId: 'Unknown account' }))

        await request.patch(`/api/accounts/${b.id}`).send({ archived: true }).expect(200)
        await transfer({ fromAccountId: a.id, toAccountId: b.id, amount: 1 }).expect(409)
        expect(await prisma.transaction.count()).toBe(0) // nothing half-written
    })

    it('database transactions roll back everything when a step fails', async () => {
        const a = await createAccount()
        const transferId = randomUUID()
        const row = (accountId, amount) => ({ transferId, accountId, amount, date: new Date('2026-10-01'), description: 't' })

        await expect(
            prisma.$transaction(async (tx) => {
                await tx.transaction.create({ data: row(a.id, -1000) })
                await tx.transaction.create({ data: row(999999, 1000) }) // no such account → fails
            })
        ).rejects.toThrow()

        // the first insert was undone too
        expect(await prisma.transaction.count({ where: { transferId } })).toBe(0)
    })

    it('validates the transfer id', async () => {
        await request.get('/api/transfers/not-a-uuid').expect(400)
        await request.get(`/api/transfers/${randomUUID()}`).expect(404)
    })
})
