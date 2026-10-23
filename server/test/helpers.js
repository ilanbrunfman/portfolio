import supertest from 'supertest'
import app from '../src/app.js'
import { prisma } from '../src/db.js'

// Call the API without starting a server: request.get('/api/accounts')
export const request = supertest(app)

export { prisma }

/** Empty every table and restart ids at 1 – call in beforeEach */
export async function resetDb() {
    if (!process.env.DATABASE_URL.includes('_test')) throw new Error('resetDb() only runs on a _test database')
    await prisma.$executeRaw`TRUNCATE TABLE "transactions", "accounts", "categories" RESTART IDENTITY CASCADE`
}

/** Create an account through the API (so it goes through validation too) */
export async function createAccount(overrides = {}) {
    const res = await request.post('/api/accounts').send({ name: 'Checking', ...overrides }).expect(201)
    return res.body
}

/** Create a category straight in the database (there's no API for it) */
export function createCategory(overrides = {}) {
    return prisma.category.create({ data: { name: 'Groceries', kind: 'EXPENSE', ...overrides } })
}

/** Create a transaction through the API */
export async function createTransaction(accountId, overrides = {}) {
    const res = await request
        .post('/api/transactions')
        .send({ accountId, date: '2026-10-01', amount: -1000, description: 'Coffee', ...overrides })
        .expect(201)
    return res.body
}
