import { Prisma } from '../generated/prisma/client.ts'
import { prisma } from '../db.js'

/**
 * Transactions as the API sends them:
 * { id, accountId, date: 'YYYY-MM-DD', amount, description, note, transferId,
 *   category: { id, name, kind, color } | null, runningBalance? }
 */
export function toTransactionJson(row) {
    const date = row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date
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
    }
}

/**
 * One page of an account's transactions, newest first, each with the
 * account balance right after it (runningBalance).
 *
 * Pagination is by cursor: "<date>_<id>" of the last row you already have.
 * The next page is everything strictly older than it, so new rows added in
 * the meantime never shift or duplicate what you've loaded.
 *
 * @param {{ accountId: number, limit: number, cursor?: { date: string, id: number } }} options
 * @returns {Promise<{ items: object[], nextCursor: string | null }>}
 */
export async function listLedger({ accountId, limit, cursor }) {
    const olderThanCursor = cursor
        ? Prisma.sql`WHERE (ledger.date, ledger.id) < (${cursor.date}, ${cursor.id})`
        : Prisma.empty

    // ledger = every row of the account with its running balance:
    //   SUM(amount) OVER (ORDER BY date, id) adds up all rows up to this one.
    // Then we take one page from it, newest first. ${...} values are sent as
    // query parameters, never pasted into the SQL text.
    const rows = await prisma.$queryRaw`
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
                (a."openingBalance" + SUM(t.amount) OVER (ORDER BY t.date, t.id))::int AS "runningBalance"
            FROM transactions t
            JOIN accounts a ON a.id = t."accountId"
            LEFT JOIN categories c ON c.id = t."categoryId"
            WHERE t."accountId" = ${accountId}
        )
        SELECT * FROM ledger
        ${olderThanCursor}
        ORDER BY ledger.date DESC, ledger.id DESC
        LIMIT ${limit + 1}
    `

    // We asked for one extra row: if it came back, there's another page
    const hasMore = rows.length > limit
    const items = rows.slice(0, limit).map(toTransactionJson)
    const last = items.at(-1)
    return { items, nextCursor: hasMore ? `${last.date}_${last.id}` : null }
}
