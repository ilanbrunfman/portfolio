// Fills the database with demo data: a demo user (demo@bank.test / demo1234)
// owning 4 accounts, categories and ~4 months of transactions ending today.
// Run with `npm run db:seed`.
//
// ⚠ Wipes all existing rows first. Uses a fixed random seed, so every run
// produces the same data (only the dates move with "today").

import { randomUUID } from 'node:crypto'

try {
    process.loadEnvFile() // when run directly with `node prisma/seed.js`
} catch {
    // env already set (prisma db seed / hosting platform)
}

const { prisma } = await import('../src/shared/db.js')
const { hashPassword } = await import('../src/projects/bank/lib/password.js')

const DEMO_USER = { email: 'demo@bank.test', password: 'demo1234' }

// ---------- helpers ----------

// Small deterministic random generator (mulberry32)
let state = 20261022
const random = () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const between = (min, max) => min + random() * (max - min)
const pick = (list) => list[Math.floor(random() * list.length)]
const cents = (amount) => Math.round(amount * 100)

// Dates are calendar days (the column is DATE), built in UTC to avoid
// timezone shifts.
const today = new Date()
const day = (y, m, d) => new Date(Date.UTC(y, m, d))
const TODAY = day(today.getFullYear(), today.getMonth(), today.getDate())
const START = day(today.getFullYear(), today.getMonth() - 3, 1) // 1st of the month, 3 months back
const addDays = (date, n) => new Date(date.getTime() + n * 86_400_000)

// ---------- reference data ----------

const CATEGORIES = [
    { name: 'Salary', kind: 'INCOME', color: '#22a06b' },
    { name: 'Freelance', kind: 'INCOME', color: '#2f9e8f' },
    { name: 'Interest', kind: 'INCOME', color: '#4c9aff' },
    { name: 'Refund', kind: 'INCOME', color: '#8f7ee7' },
    { name: 'Rent', kind: 'EXPENSE', color: '#e5484d' },
    { name: 'Groceries', kind: 'EXPENSE', color: '#f59e0b' },
    { name: 'Dining out', kind: 'EXPENSE', color: '#f76b15' },
    { name: 'Transport', kind: 'EXPENSE', color: '#0090ff' },
    { name: 'Utilities', kind: 'EXPENSE', color: '#6e56cf' },
    { name: 'Subscriptions', kind: 'EXPENSE', color: '#aa3bff' },
    { name: 'Shopping', kind: 'EXPENSE', color: '#d6409f' },
    { name: 'Health', kind: 'EXPENSE', color: '#12a594' },
    { name: 'Entertainment', kind: 'EXPENSE', color: '#ffb224' },
]

const ACCOUNTS = [
    { key: 'checking', name: 'Everyday Checking', type: 'CHECKING', openingBalance: cents(2450), color: '#aa3bff' },
    { key: 'savings', name: 'Savings', type: 'SAVINGS', openingBalance: cents(8000), color: '#22a06b' },
    { key: 'credit', name: 'Credit Card', type: 'CREDIT', openingBalance: 0, color: '#e5484d' },
    { key: 'cash', name: 'Cash Wallet', type: 'CASH', openingBalance: cents(120), color: '#f59e0b' },
]

const SHOPS = {
    Groceries: ['Whole Foods', 'Trader Joe\'s', 'Costco', 'Farmers market', 'Corner store'],
    'Dining out': ['Pizza place', 'Sushi bar', 'Taco truck', 'Thai kitchen', 'Burger joint', 'Brunch café'],
    Transport: ['Gas station', 'Uber', 'Metro card top-up', 'Parking'],
    Shopping: ['Amazon', 'Target', 'IKEA', 'Bookstore', 'Shoe store'],
    Health: ['Pharmacy', 'Dentist co-pay', 'Vitamins'],
    Entertainment: ['Cinema', 'Concert tickets', 'Bowling', 'Museum'],
}

// ---------- seed ----------

async function main() {
    // Start clean: empty the tables and restart ids at 1
    await prisma.$executeRaw`TRUNCATE TABLE bank.transactions, bank.accounts, bank.categories, bank.sessions, bank.users RESTART IDENTITY CASCADE`

    const user = await prisma.user.create({
        data: { email: DEMO_USER.email, passwordHash: await hashPassword(DEMO_USER.password) },
    })

    await prisma.category.createMany({ data: CATEGORIES })
    const categoryId = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.name, c.id]))

    const account = {}
    for (const { key, ...data } of ACCOUNTS) {
        account[key] = (await prisma.account.create({ data: { ...data, userId: user.id } })).id
    }

    const rows = []
    const add = (accountKey, date, amount, description, category = null, note = null) => {
        if (date > TODAY) return // nothing in the future
        rows.push({
            accountId: account[accountKey],
            date,
            amount: cents(amount),
            description,
            categoryId: category ? categoryId[category] : null,
            note,
        })
    }
    // A transfer = two rows sharing one transferId (money out of one, into the other)
    const transfer = (from, to, date, amount, description) => {
        if (date > TODAY) return
        const transferId = randomUUID()
        rows.push(
            { accountId: account[from], date, amount: -cents(amount), description, transferId },
            { accountId: account[to], date, amount: cents(amount), description, transferId },
        )
    }

    // Month by month: recurring income, bills and transfers
    for (let m = 0; m < 4; m++) {
        const y = START.getUTCFullYear()
        const mo = START.getUTCMonth() + m
        const d = (n) => day(y, mo, n)

        add('checking', d(1), 2100, 'Acme Corp payroll', 'Salary')
        add('checking', d(15), 2100, 'Acme Corp payroll', 'Salary')
        add('checking', d(1), -1450, 'Rent – Maple St apartment', 'Rent')
        add('checking', d(8), -between(85, 140), 'City Power & Water', 'Utilities')
        add('checking', d(12), -59.99, 'Internet', 'Utilities')
        add('checking', d(5), -39, 'Gym membership', 'Subscriptions')
        add('credit', d(3), -15.49, 'Netflix', 'Subscriptions')
        add('credit', d(9), -10.99, 'Spotify', 'Subscriptions')
        add('savings', d(28), between(18, 26), 'Monthly interest', 'Interest')

        transfer('checking', 'savings', d(2), 500, 'Monthly savings')
        transfer('checking', 'cash', d(6), 100, 'ATM withdrawal')
        if (m === 1) add('checking', d(19), 750, 'Website project for a client', 'Freelance', 'Invoice #104')
        if (m === 2) add('credit', d(11), 42.5, 'Return – shoe store', 'Refund')
    }

    // Day by day: everyday spending
    for (let date = START; date <= TODAY; date = addDays(date, 1)) {
        if (random() < 0.3) add('credit', date, -between(18, 140), pick(SHOPS.Groceries), 'Groceries')
        if (random() < 0.22) add('credit', date, -between(12, 65), pick(SHOPS['Dining out']), 'Dining out')
        if (random() < 0.15) add('credit', date, -between(8, 60), pick(SHOPS.Transport), 'Transport')
        if (random() < 0.06) add('credit', date, -between(15, 180), pick(SHOPS.Shopping), 'Shopping')
        if (random() < 0.03) add('credit', date, -between(10, 90), pick(SHOPS.Health), 'Health')
        if (random() < 0.05) add('credit', date, -between(12, 75), pick(SHOPS.Entertainment), 'Entertainment')
        if (random() < 0.25) add('cash', date, -between(3, 6), 'Coffee', 'Dining out')
    }

    // Pay off the credit card on the 20th: last month's spending on the card
    for (let m = 1; m < 4; m++) {
        const payDay = day(START.getUTCFullYear(), START.getUTCMonth() + m, 20)
        const from = day(START.getUTCFullYear(), START.getUTCMonth() + m - 1, 1)
        const to = day(START.getUTCFullYear(), START.getUTCMonth() + m, 1)
        const spent = rows
            .filter((r) => r.accountId === account.credit && !r.transferId && r.date >= from && r.date < to) // purchases only, not earlier payments
            .reduce((sum, r) => sum + r.amount, 0)
        if (spent < 0) transfer('checking', 'credit', payDay, -spent / 100, 'Credit card payment')
    }

    rows.sort((a, b) => a.date - b.date)
    await prisma.transaction.createMany({ data: rows })

    console.log(`Seeded ${CATEGORIES.length} categories, ${ACCOUNTS.length} accounts, ${rows.length} transactions`)
    console.log(`Log in as ${DEMO_USER.email} / ${DEMO_USER.password}`)
}

try {
    await main()
} finally {
    await prisma.$disconnect()
}
