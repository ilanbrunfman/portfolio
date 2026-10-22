import { Router } from 'express'
import { prisma } from '../db.js'
import { validate } from '../middleware/validate.js'
import { HttpError } from '../lib/httpError.js'
import { idParams } from '../schemas/common.js'
import { transactionCreate, transactionUpdate } from '../schemas/transaction.js'
import { toTransactionJson } from '../services/transactions.js'

const router = Router()

// 'YYYY-MM-DD' → Date at midnight UTC (the column is a DATE, no time)
const toDate = (day) => new Date(`${day}T00:00:00Z`)

/** Turns the validated body into Prisma data (only the fields that were sent) */
function toData(body) {
    const data = { ...body }
    if (body.date) data.date = toDate(body.date)
    return data
}

/** 400 with a field error if categoryId points nowhere */
async function assertCategory(categoryId) {
    if (categoryId == null) return
    const found = await prisma.category.count({ where: { id: categoryId } })
    if (!found) throw new HttpError(400, 'Validation failed', { fields: { categoryId: 'Unknown category' } })
}

/** The transaction, or 404 */
async function findTransaction(id) {
    const transaction = await prisma.transaction.findUnique({ where: { id } })
    if (!transaction) throw new HttpError(404, 'Transaction not found')
    return transaction
}

// POST /api/transactions → 201 Created
router.post('/', validate({ body: transactionCreate }), async (req, res) => {
    const body = req.valid.body

    const account = await prisma.account.findUnique({ where: { id: body.accountId } })
    if (!account) throw new HttpError(400, 'Validation failed', { fields: { accountId: 'Unknown account' } })
    // 409 Conflict: the request is fine, but the account's state doesn't allow it
    if (account.archived) throw new HttpError(409, 'This account is archived. Restore it to add transactions.')
    await assertCategory(body.categoryId)

    const created = await prisma.transaction.create({ data: toData(body), include: { category: true } })
    res.status(201).json(toTransactionJson(created))
})

// PATCH /api/transactions/:id
router.patch('/:id', validate({ params: idParams, body: transactionUpdate }), async (req, res) => {
    const { id } = req.valid.params
    const existing = await findTransaction(id)
    if (existing.transferId) {
        throw new HttpError(409, 'This is one side of a transfer. Delete the transfer and create it again.')
    }
    await assertCategory(req.valid.body.categoryId)

    const updated = await prisma.transaction.update({
        where: { id },
        data: toData(req.valid.body),
        include: { category: true },
    })
    res.json(toTransactionJson(updated))
})

// DELETE /api/transactions/:id → 204 No Content
// A transfer is two rows; deleting either side deletes both in one statement,
// so the database never holds half a transfer.
router.delete('/:id', validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params
    const existing = await findTransaction(id)

    if (existing.transferId) {
        await prisma.transaction.deleteMany({ where: { transferId: existing.transferId } })
    } else {
        await prisma.transaction.delete({ where: { id } })
    }
    res.status(204).end()
})

export default router
