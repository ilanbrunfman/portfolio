// Ta'im demo data: one staff member per role (the people on the
// "Who are you?" screen) and a small menu. Prices are cents.
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

/** @param {import('../../src/generated/prisma/client.ts').PrismaClient} prisma */
export async function seedTaim(prisma) {
    // Start clean: empty the tables and restart ids at 1
    await prisma.$executeRaw`TRUNCATE TABLE taim.menu_items, taim.categories, taim.staff RESTART IDENTITY CASCADE`

    await prisma.staff.createMany({ data: STAFF })

    let dishCount = 0
    for (const [index, [name, items]] of MENU.entries()) {
        // Dishes keep the order they're listed in (position 1 = top)
        const dishes = items.map((item, i) => ({ ...item, position: i + 1 }))
        await prisma.menuCategory.create({ data: { name, position: index + 1, items: { create: dishes } } })
        dishCount += items.length
    }

    console.log(`Ta'im: ${STAFF.length} staff (${STAFF.map((s) => s.name).join(', ')}), ${MENU.length} categories, ${dishCount} dishes`)
}
