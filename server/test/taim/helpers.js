import supertest from 'supertest'
import app from '../../src/app.js'
import { prisma } from '../../src/shared/db.js'
import { STAFF } from '../../prisma/seeds/taim.js'

export { app, prisma }

// No cookie: nobody picked yet
export const anonymous = supertest(app)

/** Empty the Ta'im tables, restart ids at 1, and add the demo staff – call in beforeEach */
export async function resetTaim() {
    if (!process.env.DATABASE_URL.includes('_test')) throw new Error('resetTaim() only runs on a _test database')
    await prisma.$executeRaw`TRUNCATE TABLE taim.staff RESTART IDENTITY CASCADE`
    await prisma.staff.createMany({ data: STAFF })
}

/**
 * A client that has picked the first staff member with this role.
 * The agent keeps the taim_staff cookie between requests.
 * @param {'MANAGER'|'CHEF'|'COOK'|'HOST'|'WAITER'} role
 */
export async function as(role) {
    const staff = await prisma.staff.findFirstOrThrow({ where: { role } })
    const agent = supertest.agent(app)
    await agent.post('/api/taim/session').send({ staffId: staff.id }).expect(200)
    return agent
}
