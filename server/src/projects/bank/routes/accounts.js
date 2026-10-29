import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { idParams } from '../../../shared/schemas/common.js'
import { accountCreate, accountUpdate, accountListQuery } from '../schemas/account.js'
import { ledgerQuery } from '../schemas/transaction.js'
import { listLedger } from '../services/transactions.js'

const router = Router()

/**
 * Adds `balance` and `transactionCount` to each account.
 * One query for all accounts: Postgres sums the amounts per account
 * (SELECT "accountId", SUM(amount), COUNT(*) … GROUP BY "accountId").
 */
async function withBalances(accounts) {
    const totals = await prisma.transaction.groupBy({
        by: ['accountId'],
        where: { accountId: { in: accounts.map((a) => a.id) } },
        _sum: { amount: true },
        _count: { _all: true },
    })
    const byId = new Map(totals.map((t) => [t.accountId, t]))

    return accounts.map((account) => {
        const total = byId.get(account.id)
        return {
            ...account,
            balance: account.openingBalance + (total?._sum.amount ?? 0),
            transactionCount: total?._count._all ?? 0,
        }
    })
}

// Every query below includes userId: req.user.id, so a user only ever sees
// and changes their own accounts. Someone else's account → 404, as if it
// didn't exist.

// GET /api/bank/accounts – active accounts (add ?includeArchived=true for all)
router.get('/', validate({ query: accountListQuery }), async (req, res) => {
    const { includeArchived } = req.valid.query
    const accounts = await prisma.account.findMany({
        where: { userId: req.user.id, ...(!includeArchived && { archived: false }) },
        orderBy: { id: 'asc' },
    })
    res.json(await withBalances(accounts))
})

// GET /api/bank/accounts/:id
router.get('/:id', validate({ params: idParams }), async (req, res) => {
    const account = await prisma.account.findFirst({ where: { id: req.valid.params.id, userId: req.user.id } })
    if (!account) throw new HttpError(404, 'Account not found')
    const [result] = await withBalances([account])
    res.json(result)
})

// POST /api/bank/accounts → 201 Created
router.post('/', validate({ body: accountCreate }), async (req, res) => {
    const account = await prisma.account.create({ data: { ...req.valid.body, userId: req.user.id } })
    const [result] = await withBalances([account])
    res.status(201).json(result)
})

// PATCH /api/bank/accounts/:id – change some fields; { archived: true } hides it
router.patch('/:id', validate({ params: idParams, body: accountUpdate }), async (req, res) => {
    const account = await prisma.account.update({
        where: { id: req.valid.params.id, userId: req.user.id },
        data: req.valid.body,
    }) // missing or not yours → Prisma P2025 → 404 in the error handler
    const [result] = await withBalances([account])
    res.json(result)
})

// GET /api/bank/accounts/:id/transactions – newest first, with runningBalance,
// one page at a time (?limit=50&cursor=<nextCursor from the previous page>)
router.get('/:id/transactions', validate({ params: idParams, query: ledgerQuery }), async (req, res) => {
    const { id } = req.valid.params
    const exists = await prisma.account.count({ where: { id, userId: req.user.id } })
    if (!exists) throw new HttpError(404, 'Account not found')
    res.json(await listLedger({ accountId: id, ...req.valid.query }))
})

export default router
