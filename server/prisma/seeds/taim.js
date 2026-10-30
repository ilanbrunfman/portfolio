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

// Category → its dishes, in menu order, with prep times in minutes.
// Schnitzel starts sold out (hidden).
export const MENU = [
    ['Starters', [
        { name: 'Hummus with pita', price: 900, prepMinutes: 5, description: 'Tahini, olive oil, warm pita' },
        { name: 'Israeli salad', price: 800, prepMinutes: 5, description: 'Cucumber, tomato, onion, lemon' },
        { name: 'Baba ghanoush', price: 900, prepMinutes: 6, description: 'Smoked eggplant, tahini' },
    ]],
    ['Mains', [
        { name: 'Shakshuka', price: 1400, prepMinutes: 12, description: 'Eggs in spiced tomato sauce, bread' },
        { name: 'Sabich', price: 1200, prepMinutes: 8, description: 'Fried eggplant, egg, amba in pita' },
        { name: 'Falafel plate', price: 1300, prepMinutes: 10, description: 'Falafel, hummus, salad, pita' },
        { name: 'Kebab', price: 1700, prepMinutes: 15, description: 'Grilled lamb and beef, rice' },
        { name: 'Schnitzel', price: 1800, prepMinutes: 14, description: 'Chicken schnitzel, fries', hidden: true },
    ]],
    ['Desserts', [
        { name: 'Malabi', price: 700, prepMinutes: 3, description: 'Rose milk pudding, pistachio' },
        { name: 'Knafeh', price: 900, prepMinutes: 8, description: 'Warm cheese pastry, syrup' },
    ]],
    ['Drinks', [
        { name: 'Lemonana', price: 500, prepMinutes: 2, description: 'Lemon and mint, frozen' },
        { name: 'Mint tea', price: 400, prepMinutes: 3 },
        { name: 'Turkish coffee', price: 400, prepMinutes: 4 },
    ]],
]

// label, seats – in floor order
export const TABLES = [
    ['T1', 2], ['T2', 4], ['T3', 2], ['T4', 4],
    ['T5', 6], ['T6', 6], ['T7', 4], ['T8', 8],
]

// Orders open right now: [table or take-out name, guests, opened by, minutes ago, dishes]
// In a dish: " #2" = for seat 2 (none = shared), " ✓" = already sent out,
// " ○" = on the bill but not sent to the kitchen yet, " r2" = sent in the
// order's 2nd round (15 minutes after the 1st; no "r" = round 1).
const OPEN_ORDERS = [
    ['T2', 3, 'Lior', 34, ['Hummus with pita ✓', 'Lemonana #3 ✓', 'Shakshuka #1 r2', 'Sabich #2 r2 ✓']],
    ['T5', 6, 'Lior', 12, ['Kebab #1', 'Sabich #2', 'Falafel plate #3', 'Mint tea #4', 'Mint tea #5', 'Malabi #6 ○']],
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
                customerPhone: isTable ? null : '050-123-4567',
                openedById: staffId[by],
                openedAt,
                items: {
                    create: dishes.map((entry) => {
                        const sent = entry.endsWith(' ✓')
                        const notSent = entry.endsWith(' ○')
                        const [, name, seat, round] = entry.replace(/ [✓○]$/, '').match(/^(.+?)(?: #(\d+))?(?: r(\d+))?$/)
                        const { id, price } = dish[name]
                        const r = notSent ? null : Number(round ?? 1)
                        const firedAt = r ? new Date(openedAt.getTime() + (r - 1) * 15 * 60_000) : null
                        return {
                            menuItemId: id, price, seat: seat ? Number(seat) : null, createdAt: firedAt ?? openedAt,
                            status: notSent ? 'NEW' : sent ? 'SENT_OUT' : 'PREPARING',
                            firedAt, round: r,
                            sentOutAt: sent ? new Date() : null,
                        }
                    }),
                },
            },
        })
    }

    console.log(`Ta'im: ${STAFF.length} staff (${STAFF.map((s) => s.name).join(', ')}), ${MENU.length} categories, ${dishCount} dishes, ${TABLES.length} tables, ${OPEN_ORDERS.length} open orders`)
}
