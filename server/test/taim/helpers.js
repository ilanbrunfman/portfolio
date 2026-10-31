import supertest from 'supertest'
import app from '../../src/app.js'
import { prisma } from '../../src/shared/db.js'
import { STAFF } from '../../prisma/seeds/taim.js'

export { app, prisma }

// No cookie: nobody picked yet
export const anonymous = supertest(app)

/** Empty the Ta'im tables, restart ids at 1, add the demo staff and an empty active menu version (id 1; no dishes, no tables) – call in beforeEach */
export async function resetTaim() {
    if (!process.env.DATABASE_URL.includes('_test')) throw new Error('resetTaim() only runs on a _test database')
    await prisma.$executeRaw`TRUNCATE TABLE taim.item_returns, taim.order_items, taim.orders, taim.business_days, taim.dining_tables, taim.menu_items, taim.categories, taim.menu_versions, taim.staff RESTART IDENTITY CASCADE`
    await prisma.staff.createMany({ data: STAFF })
    // Version 1: the menu in use. Tests put their categories and dishes in it (versionId: 1)
    await prisma.menuVersion.create({ data: { number: 1, name: 'Test menu', status: 'ACTIVE', activeFrom: new Date(Date.now() - 86_400_000) } })
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
