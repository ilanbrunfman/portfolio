// Ta'im demo data: one staff member per role (the people on the
// "Who are you?" screen), a small menu, 8 tables and a few open orders so
// the floor isn't empty. Prices are cents.
//
// ⚠ Wipes all Ta'im rows first.

export const STAFF = [
    { name: 'Noa', role: 'MANAGER' },
    { name: 'Avi', role: 'CHEF' },
    { name: 'Yossi', role: 'COOK' },
    { name: 'Dana', role: 'HOST' },
    { name: 'Lior', role: 'WAITER' },
]

// Category → its dishes, in menu order. Schnitzel starts sold out (hidden).
export const MENU = [
    ['Starters', [
        { name: 'Hummus with pita', price: 900, description: 'Tahini, olive oil, warm pita' },
        { name: 'Israeli salad', price: 800, description: 'Cucumber, tomato, onion, lemon' },
        { name: 'Baba ghanoush', price: 900, description: 'Smoked eggplant, tahini' },
    ]],
    ['Mains', [
        { name: 'Shakshuka', price: 1400, description: 'Eggs in spiced tomato sauce, bread' },
        { name: 'Sabich', price: 1200, description: 'Fried eggplant, egg, amba in pita' },
        { name: 'Falafel plate', price: 1300, description: 'Falafel, hummus, salad, pita' },
        { name: 'Kebab', price: 1700, description: 'Grilled lamb and beef, rice' },
        { name: 'Schnitzel', price: 1800, description: 'Chicken schnitzel, fries', hidden: true },
    ]],
    ['Desserts', [
        { name: 'Malabi', price: 700, description: 'Rose milk pudding, pistachio' },
        { name: 'Knafeh', price: 900, description: 'Warm cheese pastry, syrup' },
    ]],
    ['Drinks', [
        { name: 'Lemonana', price: 500, description: 'Lemon and mint, frozen' },
        { name: 'Mint tea', price: 400 },
        { name: 'Turkish coffee', price: 400 },
    ]],
]

// label, seats – in floor order
export const TABLES = [
    ['T1', 2], ['T2', 4], ['T3', 2], ['T4', 4],
    ['T5', 6], ['T6', 6], ['T7', 4], ['T8', 8],
]

// Orders open right now: [table or take-out name, guests, opened by, minutes ago, dishes]
// In a dish: " #2" = for seat 2 (none = shared), " ✓" = already sent out.
const OPEN_ORDERS = [
    ['T2', 3, 'Lior', 34, ['Hummus with pita ✓', 'Shakshuka #1', 'Sabich #2 ✓', 'Lemonana #3 ✓']],
    ['T5', 6, 'Lior', 12, ['Kebab #1', 'Sabich #2', 'Falafel plate #3', 'Mint tea #4', 'Mint tea #5']],
    ['Maya', null, 'Dana', 9, ['Falafel plate', 'Hummus with pita']],
]

// Guests just left these tables; they need cleaning before the next guests
const NEEDS_CLEANING = ['T3']

/** @param {import('../../src/generated/prisma/client.ts').PrismaClient} prisma */
export async function seedTaim(prisma) {
    // Start clean: empty the tables and restart ids at 1
    await prisma.$executeRaw`TRUNCATE TABLE taim.order_items, taim.orders, taim.dining_tables, taim.menu_items, taim.categories, taim.staff RESTART IDENTITY CASCADE`

    await prisma.staff.createMany({ data: STAFF })

    let dishCount = 0
    for (const [index, [name, items]] of MENU.entries()) {
        // Dishes keep the order they're listed in (position 1 = top)
        const dishes = items.map((item, i) => ({ ...item, position: i + 1 }))
        await prisma.menuCategory.create({ data: { name, position: index + 1, items: { create: dishes } } })
        dishCount += items.length
    }

    await prisma.diningTable.createMany({
        data: TABLES.map(([label, seats], i) => ({ label, seats, position: i + 1, needsCleaning: NEEDS_CLEANING.includes(label) })),
    })

    // A few open orders, with prices copied from the menu like the API does
    const staffId = Object.fromEntries((await prisma.staff.findMany()).map((p) => [p.name, p.id]))
    const tableId = Object.fromEntries((await prisma.diningTable.findMany()).map((t) => [t.label, t.id]))
    const dish = Object.fromEntries((await prisma.menuItem.findMany()).map((d) => [d.name, d]))
    for (const [where, guests, by, minutesAgo, dishes] of OPEN_ORDERS) {
        const openedAt = new Date(Date.now() - minutesAgo * 60_000)
        const isTable = where in tableId
        await prisma.order.create({
            data: {
                type: isTable ? 'TABLE' : 'TAKEOUT',
                tableId: isTable ? tableId[where] : null,
                guests: isTable ? guests : null,
                customerName: isTable ? null : where,
                openedById: staffId[by],
                openedAt,
                items: {
                    create: dishes.map((entry) => {
                        const sent = entry.endsWith(' ✓')
                        const [, name, seat] = entry.replace(' ✓', '').match(/^(.+?)(?: #(\d+))?$/)
                        const { id, price } = dish[name]
                        return {
                            menuItemId: id, price, seat: seat ? Number(seat) : null,
                            status: sent ? 'SENT_OUT' : 'PREPARING', createdAt: openedAt, sentOutAt: sent ? new Date() : null,
                        }
                    }),
                },
            },
        })
    }

    console.log(`Ta'im: ${STAFF.length} staff (${STAFF.map((s) => s.name).join(', ')}), ${MENU.length} categories, ${dishCount} dishes, ${TABLES.length} tables, ${OPEN_ORDERS.length} open orders`)
}
