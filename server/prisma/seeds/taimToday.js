// A random day of service for today, added to the database as it is (it
// deletes nothing): customers since noon – their bills, the kitchen's work
// on them, a dish now and then sent back, fixed or wasted – and the tables
// dining right now, with tickets waiting, cooking or on hold.
//
//   npm run db:today:taim
//
// "Today" is the business day running now (it ends at TAIM_DAY_ENDS_AT,
// 04:00), on the restaurant's clock. Refused when today already has bills.

import { random, seedClosedBill, seedOpenOrders } from './taim.js'

const MINUTE = 60_000
const minutesAgo = (now, minutes) => new Date(now.getTime() - minutes * MINUTE)

/**
 * @param {import('../../src/generated/prisma/client.ts').PrismaClient} prisma
 * @returns {Promise<string>} what was added, in one line
 */
export async function seedToday(prisma, now = new Date()) {
    const { lastDayEnd, zonedTime, restaurantToday, TIME_ZONE } = await import('../../src/projects/taim/services/days.js')
    const { activeVersion } = await import('../../src/projects/taim/services/menuVersions.js')

    // Today's service starts at 12:00 on the business day's date
    const dayStart = lastDayEnd(now)
    const date = restaurantToday(dayStart, TIME_ZONE)
    const serviceStart = zonedTime(date.year, date.month, date.day, 12, 0)
    if (now - serviceStart < 30 * MINUTE) return `Today's service starts at 12:00: nothing to add yet`

    const already = await prisma.order.count({ where: { businessDayId: null } })
    if (already > 0) throw new Error(`Today already has ${already} bills: close the day first, or try tomorrow`)

    // People by role (the seed's names when they're there)
    const staff = await prisma.staff.findMany({ where: { active: true }, orderBy: { id: 'asc' } })
    const first = (role) => staff.find((p) => p.role === role)?.id
    const staffId = { Noa: first('MANAGER'), Avi: first('CHEF'), Yossi: first('COOK'), Dana: first('HOST'), Lior: first('WAITER') }
    const missing = Object.entries(staffId).filter(([, id]) => !id).map(([name]) => name)
    if (missing.length) throw new Error(`Needs one active person per role (missing: ${missing.join(', ')})`)
    const names = Object.fromEntries(Object.entries(staffId).map(([name, id]) => [id, name]))

    // The menu in use
    const version = await activeVersion(prisma)
    const dish = Object.fromEntries((await prisma.menuItem.findMany({ where: { versionId: version.id } })).map((d) => [d.name, d]))
    const dishes = Object.values(dish).filter((d) => !d.hidden)
    const mains = dishes.filter((d) => d.prepMinutes >= 8)
    const quick = dishes.filter((d) => (d.prepMinutes ?? 5) < 8)
    if (mains.length === 0) throw new Error('The menu in use has no mains')

    const tables = await prisma.diningTable.findMany({ where: { joinedToId: null }, orderBy: { position: 'asc' } })
    const rand = random(Math.floor(now.getTime() / 1000)) // a different day every run
    const pick = (list) => list[Math.floor(rand() * list.length)]
    const counts = { bills: 0, returns: 0, waste: 0, fixes: 0 }

    // Earlier customers: closed bills from noon until ~1½ hours ago, more on Thu–Sat
    const weekend = [4, 5, 6].includes(date.weekday)
    const lastOpen = minutesAgo(now, 100)
    const hours = Math.max(0, (lastOpen - serviceStart) / (60 * MINUTE))
    const billCount = Math.round(hours * (weekend ? 2 : 1.4) * (0.8 + rand() * 0.4))
    for (let b = 0; b < billCount; b += 1) {
        const openedAt = new Date(serviceStart.getTime() + rand() * (lastOpen - serviceStart))
        await seedClosedBill(prisma, { openedAt, closeBy: minutesAgo(now, 5), staffId, tables, dish, dishes, mains, rand, counts })
    }

    // Right now: a few free tables dining (fewer late at night), maybe a take-out
    const busy = new Set((await prisma.order.findMany({ where: { status: 'OPEN' }, select: { tableId: true } })).map((o) => o.tableId))
    const free = tables.filter((t) => !t.needsCleaning && !busy.has(t.id)).sort(() => rand() - 0.5)
    const lateNight = now - serviceStart > 11 * 60 * MINUTE
    const dining = free.slice(0, Math.min(free.length, lateNight ? 2 + Math.floor(rand() * 2) : 3 + Math.floor(rand() * 3)))
    const orders = dining.map((table) => {
        const guests = 1 + Math.floor(rand() * table.seats)
        const opened = 12 + Math.floor(rand() * 60) // minutes ago
        const startersSent = opened - 3
        const mainsSent = Math.max(1, Math.floor(opened * 0.45))
        const startersDone = startersSent > 18
        const by = rand() < 0.75 ? 'Lior' : 'Noa'
        const items = []
        // Starters or drinks for the table, then a main per guest
        for (let i = 0; i < 1 + Math.floor(rand() * 2); i += 1) {
            items.push([pick(quick.length ? quick : dishes).name, { seat: null, round: 1, status: startersDone ? 'SERVED' : rand() < 0.5 ? 'COOKING' : 'WAITING', sent: startersSent }])
        }
        const mainsState = !startersDone ? 'HELD' : pick(['WAITING', 'COOKING', 'COOKING'])
        for (let seat = 1; seat <= guests; seat += 1) {
            items.push([pick(mains).name, mainsState === 'HELD' ? { seat, status: 'HELD' } : { seat, round: 2, status: mainsState, sent: mainsSent }])
        }
        if (rand() < 0.3) items.push([pick(dishes).name, { seat: 1, status: 'NEW' }]) // just added, not sent yet
        const order = { where: table.label, guests, by, opened, dishes: items }
        // Now and then a guest with an allergy: the clashing dish was confirmed ("the kitchen will adapt it")
        const clash = items.find(([name, d]) => d.seat && dish[name].allergens.length > 0)
        if (clash && rand() < 0.35) {
            order.allergies = [{ seat: clash[1].seat, allergens: [dish[clash[0]].allergens[0]], note: rand() < 0.5 ? 'severe' : null }]
            clash[1].allergyConfirmed = true
        }
        return order
    })
    if (!lateNight && rand() < 0.6) {
        const opened = 5 + Math.floor(rand() * 15)
        orders.push({ where: pick(['Maya', 'Omer', 'Tzlil', 'Ben', 'Chen', 'Yael']), by: 'Dana', opened, phone: '050-555-0123', dishes: [[pick(mains).name, { round: 1, status: 'COOKING', sent: opened - 2 }], [pick(dishes).name, { round: 1, status: 'COOKING', sent: opened - 2 }]] })
    }
    const tableId = Object.fromEntries(tables.map((t) => [t.label, t.id]))
    // seedOpenOrders counts minutes back from the real now
    await seedOpenOrders(prisma, orders, { staffId, tableId, dish })

    // A table guests just left, not cleaned yet
    const leftover = free.slice(dining.length)[0]
    if (leftover && rand() < 0.5) await prisma.diningTable.update({ where: { id: leftover.id }, data: { needsCleaning: true } })

    const tablesNow = orders.filter((o) => o.where in tableId).length
    return `Today (${date.day}/${date.month + 1}): ${counts.bills} closed bills since 12:00 (${counts.returns} came back, ${counts.fixes} fixed, ${counts.waste} wasted), ${tablesNow} tables dining now${orders.length > tablesNow ? ' and a take-out cooking' : ''}${orders.some((o) => o.allergies) ? ', one with an allergy' : ''}; people: ${Object.values(staffId).map((id) => names[id]).join(', ')}`
}
