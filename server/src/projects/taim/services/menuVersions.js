import { prisma } from '../../../shared/db.js'
import { HttpError } from '../../../shared/lib/httpError.js'

// Menu versions (step 3.1). One ACTIVE version is the menu in use; the Chef
// edits a DRAFT copy and publishes it now or on a date (SCHEDULED until
// then); the version it replaces becomes ARCHIVED with its dates.

const LOCK = 7314002 // one switch of versions at a time

export const VERSION_SELECT = {
    id: true,
    number: true,
    name: true,
    season: true,
    note: true,
    status: true,
    basedOnId: true,
    createdAt: true,
    publishedAt: true,
    activeFrom: true,
    activeTo: true,
    createdBy: { select: { id: true, name: true } },
    publishedBy: { select: { id: true, name: true } },
}

/**
 * Make `version` the menu in use from `at`: the one in use until now is
 * archived (it ran until `at`). Runs inside a transaction.
 */
async function activate(tx, version, at) {
    await tx.menuVersion.updateMany({ where: { status: 'ACTIVE' }, data: { status: 'ARCHIVED', activeTo: at } })
    await tx.menuVersion.update({ where: { id: version.id }, data: { status: 'ACTIVE', activeFrom: at, activeTo: null } })
}

/**
 * A scheduled version whose start has come becomes the menu in use (it
 * started at its date, not when this runs). Called before reading the menu
 * and by the timer; safe to call any time.
 */
export async function applyDueVersion(now = new Date()) {
    const due = await prisma.menuVersion.findFirst({ where: { status: 'SCHEDULED', activeFrom: { lte: now } }, select: { id: true, activeFrom: true } })
    if (!due) return null
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK})`
        const still = await tx.menuVersion.findFirst({ where: { id: due.id, status: 'SCHEDULED' } })
        if (!still) return null
        await activate(tx, still, still.activeFrom)
        return still.id
    })
}

/** The menu in use (after switching to a scheduled one that's due) */
export async function activeVersion(db = prisma) {
    if (db === prisma) await applyDueVersion()
    const version = await db.menuVersion.findFirst({ where: { status: 'ACTIVE' }, select: { id: true, number: true, name: true } })
    if (!version) throw new HttpError(409, 'There is no menu in use yet')
    return version
}

/** The draft, or 409 when there isn't one (dish and category changes go there) */
export async function requireDraft(db = prisma) {
    const draft = await db.menuVersion.findFirst({ where: { status: 'DRAFT' }, select: { id: true } })
    if (!draft) throw new HttpError(409, 'Start a draft first: the menu in use changes only when a draft is published')
    return draft
}

/**
 * A new draft: a copy of the menu in use (categories, dishes, prices, prep
 * times, descriptions, sold out), each dish keeping its dishKey. One draft
 * at a time (409).
 */
export async function createDraft({ name, season, note, staffId }) {
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK})`
        if (await tx.menuVersion.findFirst({ where: { status: { in: ['DRAFT', 'SCHEDULED'] } } })) {
            throw new HttpError(409, 'There is already a draft (or a scheduled menu): finish or discard it first')
        }
        const active = await tx.menuVersion.findFirst({
            where: { status: 'ACTIVE' },
            include: { categories: { orderBy: { position: 'asc' }, include: { items: { orderBy: [{ position: 'asc' }, { id: 'asc' }] } } } },
        })
        const { _max } = await tx.menuVersion.aggregate({ _max: { number: true } })
        const draft = await tx.menuVersion.create({
            data: { number: (_max.number ?? 0) + 1, name, season, note, status: 'DRAFT', basedOnId: active?.id ?? null, createdById: staffId },
        })
        if (active) await copyMenu(tx, active.id, draft.id)
        return tx.menuVersion.findUniqueOrThrow({ where: { id: draft.id }, select: VERSION_SELECT })
    })
}

/**
 * Copy one version's categories and dishes into another (dishes keep their
 * dishKey). soldOut false = every dish starts on the menu.
 */
async function copyMenu(tx, fromId, toId, { soldOut = true } = {}) {
    const categories = await tx.menuCategory.findMany({ where: { versionId: fromId }, orderBy: { position: 'asc' }, include: { items: true } })
    for (const category of categories) {
        const copy = await tx.menuCategory.create({ data: { versionId: toId, name: category.name, position: category.position } })
        if (category.items.length === 0) continue
        await tx.menuItem.createMany({
            data: category.items.map((item) => ({
                versionId: toId,
                categoryId: copy.id,
                dishKey: item.dishKey,
                name: item.name,
                description: item.description,
                price: item.price,
                prepMinutes: item.prepMinutes,
                position: item.position,
                hidden: soldOut ? item.hidden : false,
            })),
        })
    }
}

/**
 * Use an older (archived) menu again, now: it comes back as a new version
 * (same name, dishes and prices, "back from #2"), so every version keeps
 * one period of its own and its income stays right. The menu in use is
 * archived. A draft or a scheduled menu stays as it is. Sold out starts
 * fresh.
 */
export async function useAgain({ id, staffId, now = new Date() }) {
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK})`
        const old = await tx.menuVersion.findUnique({ where: { id } })
        if (!old) throw new HttpError(404, 'Menu version not found')
        if (old.status !== 'ARCHIVED') throw new HttpError(409, 'Only an older menu can be used again')
        const { _max } = await tx.menuVersion.aggregate({ _max: { number: true } })
        await tx.menuVersion.updateMany({ where: { status: 'ACTIVE' }, data: { status: 'ARCHIVED', activeTo: now } })
        const again = await tx.menuVersion.create({
            data: {
                number: (_max.number ?? 0) + 1,
                name: old.name,
                season: old.season,
                note: `Back from #${old.number}`,
                status: 'ACTIVE',
                basedOnId: old.id,
                createdById: staffId,
                createdAt: now,
                publishedById: staffId,
                publishedAt: now,
                activeFrom: now,
            },
        })
        await copyMenu(tx, old.id, again.id, { soldOut: false })
        return tx.menuVersion.findUniqueOrThrow({ where: { id: again.id }, select: VERSION_SELECT })
    })
}

/**
 * Publish the draft: now (it becomes the menu in use at once) or from
 * `startsAt` (SCHEDULED; it switches by itself then). Only the draft, only
 * with at least one dish.
 */
export async function publishDraft({ id, startsAt, staffId, now = new Date() }) {
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK})`
        const draft = await tx.menuVersion.findFirst({ where: { id, status: 'DRAFT' }, include: { _count: { select: { items: true } } } })
        if (!draft) throw new HttpError(409, 'Only the draft can be published')
        if (draft._count.items === 0) throw new HttpError(409, 'The draft has no dishes yet')
        await tx.menuVersion.update({ where: { id }, data: { publishedAt: now, publishedById: staffId } })
        if (startsAt && startsAt > now) {
            await tx.menuVersion.update({ where: { id }, data: { status: 'SCHEDULED', activeFrom: startsAt } })
        } else {
            await activate(tx, draft, now)
        }
        return tx.menuVersion.findUniqueOrThrow({ where: { id }, select: VERSION_SELECT })
    })
}

/** A scheduled version back to a draft (not published after all) */
export async function unschedule(id) {
    const { count } = await prisma.menuVersion.updateMany({ where: { id, status: 'SCHEDULED' }, data: { status: 'DRAFT', activeFrom: null, publishedAt: null, publishedById: null } })
    if (count === 0) throw new HttpError(409, 'Only a scheduled menu can go back to being a draft')
}

/** Discard the draft (or a scheduled one): its categories and dishes go with it */
export async function discard(id) {
    const version = await prisma.menuVersion.findUnique({ where: { id }, select: { status: true } })
    if (!version) throw new HttpError(404, 'Menu version not found')
    if (version.status !== 'DRAFT' && version.status !== 'SCHEDULED') throw new HttpError(409, 'Only a draft or a scheduled menu can be discarded')
    await prisma.$transaction([
        prisma.menuItem.deleteMany({ where: { versionId: id } }),
        prisma.menuCategory.deleteMany({ where: { versionId: id } }),
        prisma.menuVersion.delete({ where: { id } }),
    ])
}

/**
 * What changed from `before` to `after` (lists of dishes with dishKey,
 * name, price, prepMinutes, description, category): dishes added, removed,
 * and changed field by field – added first, then changed, then removed.
 */
export function changesBetween(before, after) {
    const old = new Map(before.map((dish) => [dish.dishKey, dish]))
    const now = new Map(after.map((dish) => [dish.dishKey, dish]))
    const changes = []
    for (const dish of after) {
        const was = old.get(dish.dishKey)
        if (!was) {
            changes.push({ type: 'added', name: dish.name, price: dish.price, category: dish.category })
            continue
        }
        const fields = {}
        for (const field of ['name', 'price', 'prepMinutes', 'description', 'category']) {
            if ((was[field] ?? null) !== (dish[field] ?? null)) fields[field] = { from: was[field] ?? null, to: dish[field] ?? null }
        }
        if (Object.keys(fields).length > 0) changes.push({ type: 'changed', name: dish.name, fields })
    }
    for (const dish of before) {
        if (!now.has(dish.dishKey)) changes.push({ type: 'removed', name: dish.name, price: dish.price, category: dish.category })
    }
    // Added first, then changed, then removed; by name within each
    const ORDER = { added: 0, changed: 1, removed: 2 }
    return changes.sort((x, y) => ORDER[x.type] - ORDER[y.type] || x.name.localeCompare(y.name))
}
