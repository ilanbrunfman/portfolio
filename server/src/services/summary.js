import { prisma } from '../db.js'

const TREND_MONTHS = 6

/** '2026-10' + n months → '2026-11' (n can be negative) */
const addMonths = (month, n) => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(Date.UTC(y, m - 1 + n, 1))
    return d.toISOString().slice(0, 7)
}

/**
 * Income vs spending for one month, spending by category, and a trend of
 * the last 6 months. Only real income/spending counts: transfers (money
 * moving between your own accounts) and archived accounts are left out.
 * All amounts are positive cents.
 *
 * @param {number} userId  only this user's accounts
 * @param {string} month   'YYYY-MM'
 */
export async function getSummary(userId, month) {
    const start = new Date(`${month}-01T00:00:00Z`)
    const end = new Date(`${addMonths(month, 1)}-01T00:00:00Z`)
    const trendStart = `${addMonths(month, -(TREND_MONTHS - 1))}-01`

    const [byCategoryRaw, categories, trend] = await Promise.all([
        // Spending per category this month (Prisma groupBy → GROUP BY "categoryId")
        prisma.transaction.groupBy({
            by: ['categoryId'],
            where: {
                transferId: null,
                amount: { lt: 0 },
                date: { gte: start, lt: end },
                account: { archived: false, userId },
            },
            _sum: { amount: true },
            _count: { _all: true },
        }),
        prisma.category.findMany(),
        // Month by month: generate_series makes every month (even empty ones),
        // then each month is matched to its transactions.
        prisma.$queryRaw`
            SELECT
                to_char(m, 'YYYY-MM') AS month,
                COALESCE(SUM(t.amount) FILTER (WHERE t.amount > 0), 0)::int AS income,
                COALESCE(-SUM(t.amount) FILTER (WHERE t.amount < 0), 0)::int AS spent
            FROM generate_series(${trendStart}::date, ${`${month}-01`}::date, interval '1 month') AS m
            LEFT JOIN transactions t
                ON date_trunc('month', t.date) = m
               AND t."transferId" IS NULL
               AND t."accountId" IN (SELECT id FROM accounts WHERE NOT archived AND "userId" = ${userId})
            GROUP BY m
            ORDER BY m
        `,
    ])

    const categoryById = new Map(categories.map((c) => [c.id, c]))
    const byCategory = byCategoryRaw
        .map((row) => {
            const category = categoryById.get(row.categoryId)
            return {
                categoryId: row.categoryId,
                name: category?.name ?? 'Uncategorized',
                color: category?.color ?? null,
                total: -row._sum.amount,
                count: row._count._all,
            }
        })
        .sort((a, b) => b.total - a.total)

    const current = trend.at(-1)
    return {
        month,
        income: current.income,
        spent: current.spent,
        net: current.income - current.spent,
        byCategory,
        trend,
    }
}
