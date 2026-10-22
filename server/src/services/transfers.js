import { randomUUID } from 'node:crypto'
import { prisma } from '../db.js'
import { HttpError } from '../lib/httpError.js'
import { toDate, toDay } from '../lib/dates.js'

/**
 * A transfer is two transaction rows sharing a transferId:
 *   out: amount < 0 on the "from" account
 *   in:  amount > 0 on the "to" account
 * Every write here runs inside prisma.$transaction, so both rows change
 * together or not at all.
 */

/** Two rows → { transferId, fromAccountId, toAccountId, amount, date, description, note } */
export function toTransferJson(out, inn) {
    return {
        transferId: out.transferId,
        fromAccountId: out.accountId,
        toAccountId: inn.accountId,
        amount: inn.amount,
        date: toDay(out.date),
        description: out.description,
        note: out.note,
    }
}

/**
 * Both accounts must exist (400) and be active (409).
 * @param {import('../generated/prisma/client.ts').Prisma.TransactionClient} tx
 */
async function assertOpenAccounts(tx, { fromAccountId, toAccountId }) {
    const accounts = await tx.account.findMany({ where: { id: { in: [fromAccountId, toAccountId] } } })
    const byId = new Map(accounts.map((a) => [a.id, a]))

    const fields = {}
    if (!byId.has(fromAccountId)) fields.fromAccountId = 'Unknown account'
    if (!byId.has(toAccountId)) fields.toAccountId = 'Unknown account'
    if (Object.keys(fields).length) throw new HttpError(400, 'Validation failed', { fields })

    const archived = accounts.find((a) => a.archived)
    if (archived) throw new HttpError(409, `${archived.name} is archived. Restore it to use it in a transfer.`)
}

/** The two rows of a transfer, or 404 */
async function findPair(tx, transferId) {
    const rows = await tx.transaction.findMany({ where: { transferId } })
    const out = rows.find((r) => r.amount < 0)
    const inn = rows.find((r) => r.amount > 0)
    if (rows.length !== 2 || !out || !inn) throw new HttpError(404, 'Transfer not found')
    return { out, inn }
}

/**
 * Create both sides of a transfer.
 * @param {{ fromAccountId: number, toAccountId: number, amount: number, date: string, description: string, note?: string|null }} input
 */
export async function createTransfer(input) {
    return prisma.$transaction(async (tx) => {
        await assertOpenAccounts(tx, input)

        const shared = {
            transferId: randomUUID(),
            date: toDate(input.date),
            description: input.description,
            note: input.note ?? null,
            categoryId: null,
        }
        const out = await tx.transaction.create({ data: { ...shared, accountId: input.fromAccountId, amount: -input.amount } })
        // If this second insert fails, Postgres rolls back the first one too
        const inn = await tx.transaction.create({ data: { ...shared, accountId: input.toAccountId, amount: input.amount } })
        return toTransferJson(out, inn)
    })
}

/** @param {string} transferId */
export async function getTransfer(transferId) {
    const { out, inn } = await findPair(prisma, transferId)
    return toTransferJson(out, inn)
}

/**
 * Change any of: fromAccountId, toAccountId, amount, date, description, note.
 * @param {string} transferId
 * @param {object} changes
 */
export async function updateTransfer(transferId, changes) {
    return prisma.$transaction(async (tx) => {
        const { out, inn } = await findPair(tx, transferId)

        const fromAccountId = changes.fromAccountId ?? out.accountId
        const toAccountId = changes.toAccountId ?? inn.accountId
        if (fromAccountId === toAccountId) {
            throw new HttpError(400, 'Validation failed', { fields: { toAccountId: 'Pick two different accounts' } })
        }
        // Old and new accounts must all be active
        await assertOpenAccounts(tx, { fromAccountId: out.accountId, toAccountId: inn.accountId })
        await assertOpenAccounts(tx, { fromAccountId, toAccountId })

        const amount = changes.amount ?? inn.amount
        const shared = {
            ...(changes.date && { date: toDate(changes.date) }),
            ...(changes.description !== undefined && { description: changes.description }),
            ...(changes.note !== undefined && { note: changes.note }),
        }
        const newOut = await tx.transaction.update({ where: { id: out.id }, data: { ...shared, accountId: fromAccountId, amount: -amount } })
        const newIn = await tx.transaction.update({ where: { id: inn.id }, data: { ...shared, accountId: toAccountId, amount } })
        return toTransferJson(newOut, newIn)
    })
}

/** @param {string} transferId */
export async function deleteTransfer(transferId) {
    const { count } = await prisma.transaction.deleteMany({ where: { transferId } })
    if (count === 0) throw new HttpError(404, 'Transfer not found')
}
