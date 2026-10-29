import supertest from 'supertest'
import app from '../../src/app.js'
import { prisma } from '../../src/shared/db.js'

export const PASSWORD = 'password123'

/** A new user, signed up and logged in: an agent keeps its cookie between requests */
export async function signUp(email) {
    const agent = supertest.agent(app)
    await agent.post('/api/auth/signup').send({ email, password: PASSWORD }).expect(201)
    return agent
}

// Call the API without starting a server: request.get('/api/accounts').
// After resetDb() it's logged in as owner@test.dev (live binding: importers
// see the new agent). `anonymous` never has a cookie.
export let request = supertest.agent(app)
export const anonymous = supertest(app)

export { prisma }

/** Empty every table, restart ids at 1, and log `request` in as a fresh user – call in beforeEach */
export async function resetDb() {
    if (!process.env.DATABASE_URL.includes('_test')) throw new Error('resetDb() only runs on a _test database')
    await prisma.$executeRaw`TRUNCATE TABLE "transactions", "accounts", "categories", "sessions", "users" RESTART IDENTITY CASCADE`
    request = await signUp('owner@test.dev')
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
