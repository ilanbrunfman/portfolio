// Ta'im demo data: one staff member per role (the people on the
// "Who are you?" screen), a small menu and 8 tables; a busy evening right
// now (tables dining, tickets in the kitchen – waiting, started, held, to
// go, a remake, a fix – and a take-out); and eight weeks of history (closed
// bills, dishes that came back, waste and fixes, each night closed as a
// business day) so Bills and Losses have something to show. Prices are
// cents. The history is random but the same on every run (fixed seed).
// Step 3.1: three menu versions – Summer (archived), Autumn (the menu in
// use, MENU below) and a Winter draft – and each day of history is ordered
// from the menu that was in use that day.
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

// The menus around MENU (Autumn, in use). A dish keeps its key across
// versions when its name stays, so the Versions tab can say what changed.
// Summer: lighter – a watermelon salad, cheaper shakshuka and lemonana, no
// knafeh or kebab (they came back for Autumn).
const SUMMER = MENU.map(([category, items]) => [
    category,
    [
        ...(category === 'Starters' ? [{ name: 'Watermelon salad', price: 1000, prepMinutes: 4, description: 'Watermelon, feta, mint' }] : []),
        ...items
            .filter((item) => item.name !== 'Knafeh' && item.name !== 'Kebab')
            .map((item) => ({
                ...item,
                hidden: false,
                price: { Shakshuka: 1300, Lemonana: 450 }[item.name] ?? item.price,
            })),
    ],
])
// Winter (the Chef's draft): lentil soup, and mint tea goes up
const WINTER = MENU.map(([category, items]) => [
    category,
    [
        ...(category === 'Starters' ? [{ name: 'Lentil soup', price: 1100, prepMinutes: 6, description: 'Red lentils, cumin, lemon' }] : []),
        ...items.map((item) => ({ ...item, price: item.name === 'Mint tea' ? 450 : item.price })),
    ],
])
const AUTUMN_DAYS_AGO = 21 // Autumn has been the menu in use for three weeks

// label, seats – in floor order
export const TABLES = [
    ['T1', 2], ['T2', 4], ['T3', 2], ['T4', 4],
    ['T5', 6], ['T6', 6], ['T7', 4], ['T8', 8],
]

// Guests just left these tables; they need cleaning before the next guests
const NEEDS_CLEANING = ['T3']

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60_000)

/**
 * Right now. Each dish: [name, { seat, round, status, ... }] where
 *   status   NEW (not sent) · HELD (on hold) · WAITING (sent, not started) ·
 *            COOKING (started) · SERVED
 *   sent     minutes ago it was sent (its round's send)
 *   toGo     the guest takes it home
 * cameBack / fix add the step-6 cases on top (see below).
 */
const NOW = [
    {
        where: 'T2', guests: 3, by: 'Lior', opened: 34,
        dishes: [
            ['Hummus with pita', { seat: null, round: 1, status: 'SERVED', sent: 32 }],
            ['Lemonana', { seat: 3, round: 1, status: 'SERVED', sent: 32 }],
            ['Shakshuka', { seat: 1, round: 2, status: 'COOKING', sent: 14 }],
            ['Sabich', { seat: 2, round: 2, status: 'SERVED', sent: 14 }],
            ['Kebab', { seat: 3, status: 'HELD' }],
        ],
    },
    {
        where: 'T5', guests: 6, by: 'Lior', opened: 12,
        dishes: [
            ['Kebab', { seat: 1, round: 1, status: 'WAITING', sent: 6 }],
            ['Sabich', { seat: 2, round: 1, status: 'WAITING', sent: 6 }],
            ['Falafel plate', { seat: 3, round: 1, status: 'WAITING', sent: 6 }],
            ['Mint tea', { seat: 4, round: 1, status: 'WAITING', sent: 6 }],
            ['Mint tea', { seat: 5, round: 1, status: 'WAITING', sent: 6 }],
            ['Malabi', { seat: 6, status: 'NEW' }],
        ],
    },
    {
        // Finished eating; a knafeh to take home; seat 1's shakshuka came back cold and is being remade
        where: 'T6', guests: 4, by: 'Noa', opened: 52,
        dishes: [
            ['Baba ghanoush', { seat: null, round: 1, status: 'SERVED', sent: 50 }],
            ['Shakshuka', { seat: 1, round: 1, status: 'SERVED', sent: 40, cameBack: { reason: 'COLD', note: 'lukewarm in the middle', minutes: 5, by: 'Lior', remake: true } }],
            ['Falafel plate', { seat: 2, round: 1, status: 'SERVED', sent: 40 }],
            ['Kebab', { seat: 3, round: 1, status: 'SERVED', sent: 40 }],
            ['Sabich', { seat: 4, round: 1, status: 'SERVED', sent: 40 }],
            ['Knafeh', { seat: 2, round: 2, status: 'COOKING', sent: 4, toGo: true }],
        ],
    },
    {
        // The kebab went back to be fixed: "medium, not rare"
        where: 'T7', guests: 2, by: 'Lior', opened: 27,
        dishes: [
            ['Israeli salad', { seat: null, round: 1, status: 'SERVED', sent: 25 }],
            ['Kebab', { seat: 1, round: 2, status: 'WAITING', sent: 3, fix: { reason: 'UNDERCOOKED', note: 'medium, not rare', minutes: 3, by: 'Lior' } }],
            ['Falafel plate', { seat: 2, round: 1, status: 'SERVED', sent: 25 }],
        ],
    },
    {
        where: 'Maya', by: 'Dana', opened: 9, phone: '050-123-4567',
        dishes: [
            ['Falafel plate', { round: 1, status: 'COOKING', sent: 8 }],
            ['Hummus with pita', { round: 1, status: 'COOKING', sent: 8 }],
        ],
    },
]

// A small, fixed-seed random generator (mulberry32): the same history on every run
function random(seed) {
    let a = seed
    return () => {
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const HISTORY_DAYS = 56
const TAKEOUT_NAMES = ['Maya', 'Omer', 'Tzlil', 'Ben', 'Chen', 'Yael', 'Itay', 'Noga', 'Amit', 'Shira']
const RETURN_REASONS = ['COLD', 'COLD', 'TASTE', 'TASTE', 'UNDERCOOKED', 'WRONG_DISH', 'TOO_SLOW', 'OTHER']
const RETURN_NOTES = { COLD: 'lukewarm', TASTE: 'too salty', UNDERCOOKED: 'pink inside', WRONG_DISH: 'ordered the sabich', TOO_SLOW: null, OTHER: null }
const FIX_NOTES = ['more salt', 'medium, not rare', 'extra tahini', 'warm it up']

/** @param {import('../../src/generated/prisma/client.ts').PrismaClient} prisma */
export async function seedTaim(prisma) {
    // Start clean: empty the tables and restart ids at 1
    await prisma.$executeRaw`TRUNCATE TABLE taim.item_returns, taim.order_items, taim.orders, taim.business_days, taim.dining_tables, taim.menu_items, taim.categories, taim.menu_versions, taim.staff RESTART IDENTITY CASCADE`

    await prisma.staff.createMany({ data: STAFF })
    const staffId = Object.fromEntries((await prisma.staff.findMany()).map((p) => [p.name, p.id]))

    // The three menus, on the restaurant's clock
    const { zonedTime, restaurantToday } = await import('../../src/projects/taim/services/days.js')
    const today = restaurantToday()
    const daysAgo = (days, hour = 11) => zonedTime(today.year, today.month, today.day - days, hour, 0)
    const summerFrom = daysAgo(HISTORY_DAYS)
    const autumnFrom = daysAgo(AUTUMN_DAYS_AGO)
    const keys = new Map() // dish name → dishKey, shared by every version
    const summer = await createVersion(prisma, keys, SUMMER, {
        number: 1, name: 'Summer menu', season: 'Summer', note: 'Light dishes for the hot months',
        status: 'ARCHIVED', createdById: staffId.Avi, createdAt: daysAgo(HISTORY_DAYS + 3), publishedById: staffId.Avi, publishedAt: daysAgo(HISTORY_DAYS + 1),
        activeFrom: summerFrom, activeTo: autumnFrom,
    })
    const autumn = await createVersion(prisma, keys, MENU, {
        number: 2, name: 'Autumn menu', season: 'Autumn', note: 'Knafeh and kebab are back',
        status: 'ACTIVE', basedOnId: summer.id, createdById: staffId.Avi, createdAt: daysAgo(AUTUMN_DAYS_AGO + 4), publishedById: staffId.Avi, publishedAt: daysAgo(AUTUMN_DAYS_AGO + 2),
        activeFrom: autumnFrom,
    })
    await createVersion(prisma, keys, WINTER, {
        number: 3, name: 'Winter menu', season: 'Winter', note: 'Soup season', status: 'DRAFT', basedOnId: autumn.id, createdById: staffId.Avi, createdAt: daysAgo(2, 16),
    })
    const dishCount = MENU.reduce((sum, [, items]) => sum + items.length, 0)

    await prisma.diningTable.createMany({
        data: TABLES.map(([label, seats], i) => ({ label, seats, position: i + 1, needsCleaning: NEEDS_CLEANING.includes(label) })),
    })

    const tables = await prisma.diningTable.findMany({ orderBy: { position: 'asc' } })
    const tableId = Object.fromEntries(tables.map((t) => [t.label, t.id]))
    const dishesOf = async (version) => Object.fromEntries((await prisma.menuItem.findMany({ where: { versionId: version.id } })).map((d) => [d.name, d]))
    const dish = await dishesOf(autumn)

    // Each day of history from the menu in use that day
    const history = await seedHistory(prisma, { staffId, tables, menuOn: { summer: await dishesOf(summer), autumn: dish } })
    await seedNow(prisma, { staffId, tableId, dish })

    console.log(
        `Ta'im: ${STAFF.length} staff (${STAFF.map((s) => s.name).join(', ')}), 3 menu versions (Summer, Autumn in use, a Winter draft), ${MENU.length} categories, ${dishCount} dishes, ${TABLES.length} tables, ` +
            `${NOW.length} open orders, ${history.bills} past bills in ${history.days} closed days (${history.returns} returns, ${history.waste} waste, ${history.fixes} fixes)`
    )
}

/**
 * One menu version with its categories and dishes (position 1 = top, in
 * the order listed). A dish name seen in an earlier version keeps its key.
 */
async function createVersion(prisma, keys, menu, data) {
    const version = await prisma.menuVersion.create({ data })
    for (const [index, [name, items]] of menu.entries()) {
        const dishes = items.map((item, i) => {
            if (!keys.has(item.name)) keys.set(item.name, crypto.randomUUID())
            return { ...item, dishKey: keys.get(item.name), position: i + 1 }
        })
        await prisma.menuCategory.create({ data: { versionId: version.id, name, position: index + 1, items: { create: dishes } } })
    }
    return version
}

/** The busy evening right now (NOW) */
async function seedNow(prisma, { staffId, tableId, dish }) {
    for (const order of NOW) {
        const isTable = order.where in tableId
        const created = await prisma.order.create({
            data: {
                type: isTable ? 'TABLE' : 'TAKEOUT',
                tableId: isTable ? tableId[order.where] : null,
                guests: isTable ? order.guests : null,
                customerName: isTable ? null : order.where,
                customerPhone: isTable ? null : order.phone ?? null,
                openedById: staffId[order.by],
                openedAt: minutesAgo(order.opened),
            },
        })
        for (const [name, d] of order.dishes) {
            const { id: menuItemId, price } = dish[name]
            const sentAt = d.sent ? minutesAgo(d.sent) : null
            const started = d.status === 'COOKING' || d.status === 'SERVED'
            const item = await prisma.orderItem.create({
                data: {
                    orderId: created.id, menuItemId, price, seat: d.seat ?? null, toGo: Boolean(d.toGo),
                    status: { NEW: 'NEW', HELD: 'NEW', WAITING: 'PREPARING', COOKING: 'PREPARING', SERVED: 'SENT_OUT' }[d.status],
                    held: d.status === 'HELD',
                    createdAt: minutesAgo(order.opened),
                    round: d.round ?? null,
                    firedAt: sentAt,
                    firedById: sentAt ? staffId[order.by] : null,
                    startedAt: started ? new Date(sentAt.getTime() + 60_000) : null,
                    startedById: started ? staffId.Yossi : null,
                    sentOutAt: d.status === 'SERVED' ? new Date(sentAt.getTime() + (dish[name].prepMinutes ?? 5) * 60_000) : null,
                    servedById: d.status === 'SERVED' ? staffId.Yossi : null,
                },
            })
            if (d.cameBack) {
                // It came back: off the bill, and (remake) the same dish again, free, cooking now
                const at = minutesAgo(d.cameBack.minutes)
                await prisma.orderItem.update({ where: { id: item.id }, data: { status: 'CAME_BACK' } })
                await prisma.itemReturn.create({ data: { orderItemId: item.id, kind: 'RETURN', reason: d.cameBack.reason, note: d.cameBack.note, staffId: staffId[d.cameBack.by], createdAt: at } })
                if (d.cameBack.remake) {
                    await prisma.orderItem.create({
                        data: {
                            orderId: created.id, menuItemId, price, seat: item.seat, status: 'PREPARING', round: 3, remakeOfId: item.id,
                            createdAt: at, firedAt: at, firedById: staffId[d.cameBack.by], startedAt: at, startedById: staffId.Avi,
                        },
                    })
                }
            }
            if (d.fix) {
                await prisma.itemReturn.create({ data: { orderItemId: item.id, kind: 'FIX', reason: d.fix.reason, note: d.fix.note, staffId: staffId[d.fix.by], createdAt: minutesAgo(d.fix.minutes) } })
            }
        }
    }
}

/**
 * Eight weeks of evenings: closed bills (more on Thursday to Saturday),
 * some dishes coming back (remade or not), fixed, dropped or redone, and
 * each night closed as a business day – by Noa or Avi just before
 * midnight, or by itself at 04:00 – through the app's own closeDay, so the
 * reports are what the app would have saved.
 */
async function seedHistory(prisma, { staffId, tables, menuOn }) {
    // Hours on the restaurant's clock (TAIM_TIME_ZONE), whatever this machine's is
    const { closeDay, zonedTime, restaurantToday } = await import('../../src/projects/taim/services/days.js')
    const today = restaurantToday()
    const rand = random(20261030)
    const pick = (list) => list[Math.floor(rand() * list.length)]
    const counts = { bills: 0, days: 0, returns: 0, waste: 0, fixes: 0 }

    for (let daysAgo = HISTORY_DAYS; daysAgo >= 1; daysAgo -= 1) {
        const at = (hour, minute = 0, nextDay = 0) => zonedTime(today.year, today.month, today.day - daysAgo + nextDay, hour, minute)
        const weekday = (today.weekday - (daysAgo % 7) + 7) % 7
        const weekend = [4, 5, 6].includes(weekday) // Thu, Fri, Sat
        // The menu that was in use: Summer until Autumn started
        const dish = daysAgo > AUTUMN_DAYS_AGO ? menuOn.summer : menuOn.autumn
        const dishes = Object.values(dish).filter((d) => !d.hidden)
        const mains = dishes.filter((d) => d.prepMinutes >= 8)
        const bills = Math.round((weekend ? 12 : 7) + rand() * 6)

        for (let b = 0; b < bills; b += 1) {
            const openedAt = at(12, Math.floor(rand() * 9.5 * 60)) // 12:00 – 21:30
            const takeout = rand() < 0.2
            const table = pick(tables)
            const guests = takeout ? null : 1 + Math.floor(rand() * table.seats)
            const by = rand() < 0.75 ? 'Lior' : 'Noa'
            const items = []
            const dishCountForBill = takeout ? 1 + Math.floor(rand() * 3) : guests + Math.floor(rand() * guests)
            for (let i = 0; i < dishCountForBill; i += 1) {
                const d = i < (guests ?? 1) && rand() < 0.7 ? pick(mains) : pick(dishes)
                const firedAt = new Date(openedAt.getTime() + (3 + rand() * 5) * 60_000)
                const startedAt = new Date(firedAt.getTime() + (1 + rand() * 4) * 60_000)
                const sentOutAt = new Date(startedAt.getTime() + (d.prepMinutes ?? 5) * (0.8 + rand() * 0.5) * 60_000)
                items.push({
                    menuItemId: d.id, price: d.price, seat: takeout ? null : rand() < 0.15 ? null : 1 + (i % guests),
                    status: 'SENT_OUT', round: 1, createdAt: openedAt, firedAt, firedById: staffId[by],
                    startedAt, startedById: rand() < 0.7 ? staffId.Yossi : staffId.Avi, sentOutAt, servedById: staffId.Yossi,
                })
            }
            const closedAt = new Date(openedAt.getTime() + (40 + rand() * 60) * 60_000)
            const order = await prisma.order.create({
                data: {
                    type: takeout ? 'TAKEOUT' : 'TABLE', tableId: takeout ? null : table.id, guests,
                    customerName: takeout ? pick(TAKEOUT_NAMES) : null, customerPhone: takeout ? '050-555-0101' : null,
                    status: 'CLOSED', openedById: staffId[by], openedAt, closedAt,
                    items: { create: items },
                },
                include: { items: true },
            })
            counts.bills += 1

            // Now and then a dish is sent back, given back or lost
            for (const item of order.items) {
                const roll = rand()
                const at = new Date(item.sentOutAt.getTime() + 5 * 60_000)
                if (roll < 0.04) {
                    const reason = pick(RETURN_REASONS)
                    await prisma.orderItem.update({ where: { id: item.id }, data: { status: 'CAME_BACK' } })
                    await prisma.itemReturn.create({ data: { orderItemId: item.id, kind: 'RETURN', reason, note: RETURN_NOTES[reason], staffId: staffId[by], createdAt: at } })
                    counts.returns += 1
                    if (rand() < 0.6) {
                        // made again (or the right dish), free
                        const instead = reason === 'WRONG_DISH' ? dish.Sabich : { id: item.menuItemId, price: item.price }
                        await prisma.orderItem.create({
                            data: {
                                orderId: order.id, menuItemId: instead.id, price: instead.price, seat: item.seat, status: 'SENT_OUT', round: 2, remakeOfId: item.id,
                                createdAt: at, firedAt: at, firedById: staffId[by], startedAt: at, startedById: staffId.Avi, sentOutAt: new Date(at.getTime() + 10 * 60_000), servedById: staffId.Yossi,
                            },
                        })
                    }
                } else if (roll < 0.065) {
                    await prisma.itemReturn.create({ data: { orderItemId: item.id, kind: 'FIX', reason: rand() < 0.5 ? 'UNDERCOOKED' : 'TASTE', note: pick(FIX_NOTES), staffId: staffId[by], createdAt: at } })
                    counts.fixes += 1
                } else if (roll < 0.08) {
                    // dropped or made wrong: a lost plate (WASTED) next to the one the guest got
                    const reason = rand() < 0.5 ? 'DROPPED' : 'MADE_WRONG'
                    const lost = await prisma.orderItem.create({
                        data: {
                            orderId: order.id, menuItemId: item.menuItemId, price: item.price, seat: item.seat, status: 'WASTED', round: 1,
                            createdAt: item.createdAt, firedAt: item.firedAt, firedById: item.firedById, startedAt: item.startedAt, startedById: item.startedById,
                        },
                    })
                    await prisma.itemReturn.create({ data: { orderItemId: lost.id, kind: 'WASTE', reason, staffId: reason === 'DROPPED' ? staffId[by] : staffId.Yossi, createdAt: at } })
                    counts.waste += 1
                }
            }
        }

        // Close the night: mostly Noa or Avi before midnight; now and then nobody did and it closed itself at 04:00
        const automatic = daysAgo > 1 && rand() < 0.15
        const closeAt = automatic ? at(4, 0, 1) : at(23, 40 + Math.floor(rand() * 15))
        await closeDay({ before: closeAt, closedById: automatic ? null : staffId[rand() < 0.7 ? 'Noa' : 'Avi'] })
        counts.days += 1
    }
    return counts
}
