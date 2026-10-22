import { Prisma } from '../generated/prisma/client.ts'
import { prisma } from '../db.js'
import { toDay } from '../lib/dates.js'

/**
 * Transactions as the API sends them:
 * { id, accountId, date: 'YYYY-MM-DD', amount, description, note, transferId,
 *   category: { id, name, kind, color } | null, runningBalance?, counterpartAccountId? }
 * (counterpartAccountId = the other account of a transfer, from the ledger query)
 */
export function toTransactionJson(row) {
    const date = row.date instanceof Date ? toDay(row.date) : row.date
    const category =
        row.category !== undefined
            ? row.category
            : row.categoryId
                ? { id: row.categoryId, name: row.categoryName, kind: row.categoryKind, color: row.categoryColor }
                : null
    return {
        id: row.id,
        accountId: row.accountId,
        date,
        amount: row.amount,
        description: row.description,
        note: row.note,
        transferId: row.transferId,
        category,
        ...(row.runningBalance !== undefined && { runningBalance: row.runningBalance }),
        ...(row.counterpartAccountId !== undefined && { counterpartAccountId: row.counterpartAccountId }),
    }
}

/** Escape LIKE wildcards so a search for "50%" matches the text "50%" */
const escapeLike = (text) => text.replace(/[\\%_]/g, (ch) => `\\${ch}`)

/**
 * SQL conditions for the ledger filters, applied to the "ledger" rows.
 * Each piece is a Prisma.sql fragment with its values as parameters.
 */
function filterConditions({ q, type, categoryId, from, to }) {
    const conditions = []
    if (q) {
        const pattern = `%${escapeLike(q)}%`
        conditions.push(Prisma.sql`(ledger.description ILIKE ${pattern} OR ledger.note ILIKE ${pattern})`)
    }
    if (type === 'income') conditions.push(Prisma.sql`ledger.amount > 0 AND ledger."transferId" IS NULL`)
    if (type === 'expense') conditions.push(Prisma.sql`ledger.amount < 0 AND ledger."transferId" IS NULL`)
    if (type === 'transfer') conditions.push(Prisma.sql`ledger."transferId" IS NOT NULL`)
    if (categoryId) conditions.push(Prisma.sql`ledger."categoryId" = ${categoryId}`)
    // ledger.date is 'YYYY-MM-DD' text, which sorts and compares like a date
    if (from) conditions.push(Prisma.sql`ledger.date >= ${from}`)
    if (to) conditions.push(Prisma.sql`ledger.date <= ${to}`)
    return conditions
}

/** WHERE a AND b AND c (or nothing) */
const where = (conditions) =>
    conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty

/**
 * Every row of one account with its running balance:
 *   SUM(amount) OVER (ORDER BY date, id) adds up all rows up to this one.
 * Filters are applied *after* this (to the "ledger" rows), so a filtered
 * row still shows the real account balance after it.
 */
const ledgerCte = (accountId) => Prisma.sql`
    WITH ledger AS (
        SELECT
            t.id,
            t."accountId",
            to_char(t.date, 'YYYY-MM-DD') AS date,
            t.amount,
            t.description,
            t.note,
            t."transferId",
            t."categoryId",
            c.name  AS "categoryName",
            c.kind::text AS "categoryKind",
            c.color AS "categoryColor",
            other."accountId" AS "counterpartAccountId",
            (a."openingBalance" + SUM(t.amount) OVER (ORDER BY t.date, t.id))::int AS "runningBalance"
        FROM transactions t
        JOIN accounts a ON a.id = t."accountId"
        LEFT JOIN categories c ON c.id = t."categoryId"
        -- for a transfer: the other side's row (same transferId, different id)
        LEFT JOIN transactions other ON other."transferId" = t."transferId" AND other.id <> t.id
        WHERE t."accountId" = ${accountId}
    )`

/**
 * One page of an account's transactions, newest first, each with the
 * account balance right after it (runningBalance), plus totals for
 * everything that matches the filters (not just this page).
 *
 * Pagination is by cursor: "<date>_<id>" of the last row you already have.
 * The next page is everything strictly older than it, so new rows added in
 * the meantime never shift or duplicate what you've loaded.
 *
 * @param {{ accountId: number, limit: number, cursor?: { date: string, id: number },
 *           q?: string, type?: 'income'|'expense'|'transfer', categoryId?: number, from?: string, to?: string }} options
 * @returns {Promise<{ items: object[], nextCursor: string | null, totals: { count: number, moneyIn: number, moneyOut: number } }>}
 */
export async function listLedger({ accountId, limit, cursor, ...filters }) {
    const conditions = filterConditions(filters)
    const pageConditions = cursor
        ? [...conditions, Prisma.sql`(ledger.date, ledger.id) < (${cursor.date}, ${cursor.id})`]
        : conditions

    // ${...} values are sent as query parameters, never pasted into the SQL text
    const [rows, [totals]] = await Promise.all([
        prisma.$queryRaw`
            ${ledgerCte(accountId)}
            SELECT * FROM ledger
            ${where(pageConditions)}
            ORDER BY ledger.date DESC, ledger.id DESC
            LIMIT ${limit + 1}
        `,
        prisma.$queryRaw`
            ${ledgerCte(accountId)}
            SELECT
                COUNT(*)::int AS count,
                COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0)::int AS "moneyIn",
                COALESCE(SUM(amount) FILTER (WHERE amount < 0), 0)::int AS "moneyOut"
            FROM ledger
            ${where(conditions)}
        `,
    ])

    // We asked for one extra row: if it came back, there's another page
    const hasMore = rows.length > limit
    const items = rows.slice(0, limit).map(toTransactionJson)
    const last = items.at(-1)
    return { items, nextCursor: hasMore ? `${last.date}_${last.id}` : null, totals }
}
