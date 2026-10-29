// Ta'im demo data: one staff member per role, the people on the
// "Who are you?" screen.
//
// ⚠ Wipes all Ta'im rows first.

export const STAFF = [
    { name: 'Noa', role: 'MANAGER' },
    { name: 'Avi', role: 'CHEF' },
    { name: 'Yossi', role: 'COOK' },
    { name: 'Dana', role: 'HOST' },
    { name: 'Lior', role: 'WAITER' },
]

/** @param {import('../../src/generated/prisma/client.ts').PrismaClient} prisma */
export async function seedTaim(prisma) {
    // Start clean: empty the tables and restart ids at 1
    await prisma.$executeRaw`TRUNCATE TABLE taim.staff RESTART IDENTITY CASCADE`

    await prisma.staff.createMany({ data: STAFF })

    console.log(`Ta'im: ${STAFF.length} staff (${STAFF.map((s) => s.name).join(', ')})`)
}
