import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { idParams } from '../../../shared/schemas/common.js'
import { allow } from '../middleware/staff.js'
import { versionCreate, versionUpdate, versionPublish, versionCompare } from '../schemas/menu.js'
import { VERSION_SELECT, applyDueVersion, changesBetween, createDraft, discard, publishDraft, unschedule, useAgain } from '../services/menuVersions.js'

// Menu versions (step 3.1): the history of the menu and the draft of the
// next one. Reading and drafting need editMenu (Manager, Chef); publishing
// and picking an older menu need publishMenu (Manager, Chef).
const router = Router()

const DAY = 86_400_000

/** Days a version ran (or has run so far), to the nearest day, at least 1 */
const daysActive = (version, now) => Math.max(1, Math.round(((version.activeTo ?? now) - version.activeFrom) / DAY))

/**
 * Income and dish numbers for versions that were in use, from the dishes
 * ordered from each one: income = what closed bills paid for them (not
 * dishes that came back or were wasted, nor free ones), bills, average
 * bill, per day, top dishes, and how many came back of those served.
 */
async function statsFor(versions, now) {
    const used = versions.filter((v) => v.activeFrom && v.status !== 'SCHEDULED')
    const items = await prisma.orderItem.findMany({
        where: { menuItem: { versionId: { in: used.map((v) => v.id) } } },
        select: { price: true, status: true, remakeOfId: true, orderId: true, order: { select: { status: true } }, menuItem: { select: { versionId: true, name: true } } },
    })
    const stats = new Map()
    for (const version of used) {
        const mine = items.filter((item) => item.menuItem.versionId === version.id)
        const paid = mine.filter((item) => item.order.status === 'CLOSED' && item.status !== 'CAME_BACK' && item.status !== 'WASTED' && item.remakeOfId === null)
        const income = paid.reduce((sum, item) => sum + item.price, 0)
        const bills = new Set(paid.map((item) => item.orderId)).size
        const days = daysActive(version, now)
        const counts = new Map()
        for (const item of paid) counts.set(item.menuItem.name, (counts.get(item.menuItem.name) ?? 0) + 1)
        const served = mine.filter((item) => item.status === 'SENT_OUT' || item.status === 'CAME_BACK').length
        const cameBack = mine.filter((item) => item.status === 'CAME_BACK').length
        stats.set(version.id, {
            days,
            income,
            perDay: Math.round(income / days),
            bills,
            averageBill: bills ? Math.round(income / bills) : 0,
            dishesSold: paid.length,
            topDishes: [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count })),
            returnRate: served ? Math.round((cameBack / served) * 1000) / 10 : 0, // % with one decimal
        })
    }
    return stats
}

/** Each version's dishes, as changesBetween wants them: Map versionId → dishes */
async function dishesByVersion(ids) {
    const dishes = await prisma.menuItem.findMany({
        where: { versionId: { in: ids } },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        select: { versionId: true, dishKey: true, name: true, price: true, prepMinutes: true, description: true, category: { select: { name: true } } },
    })
    const byVersion = new Map(ids.map((id) => [id, []]))
    for (const dish of dishes) byVersion.get(dish.versionId).push({ ...dish, category: dish.category.name })
    return byVersion
}

// GET /api/taim/menu/versions – every version, newest first: who and when,
// status, dishes, what changed from the version it was based on, and (for
// versions that were in use) income and dish numbers. bestId = the most
// income per day; lastId = the version before the one in use.
router.get('/menu/versions', allow('editMenu'), async (req, res) => {
    await applyDueVersion()
    const now = new Date()
    const versions = await prisma.menuVersion.findMany({ select: VERSION_SELECT, orderBy: { number: 'desc' } })
    const byVersion = await dishesByVersion(versions.map((v) => v.id))
    const stats = await statsFor(versions, now)

    const withStats = versions.map((version) => ({
        ...version,
        dishCount: byVersion.get(version.id).length,
        changes: version.basedOnId && byVersion.has(version.basedOnId) ? changesBetween(byVersion.get(version.basedOnId), byVersion.get(version.id)) : null,
        stats: stats.get(version.id) ?? null,
    }))
    const ran = withStats.filter((v) => v.stats && v.stats.income > 0)
    const best = ran.reduce((top, v) => (!top || v.stats.perDay > top.stats.perDay ? v : top), null)
    const last = withStats.filter((v) => v.status === 'ARCHIVED').sort((a, b) => b.activeTo - a.activeTo)[0]
    res.json({ versions: withStats, bestId: best?.id ?? null, lastId: last?.id ?? null })
})

// GET /api/taim/menu/versions/compare?from=1&to=2 – what changed from one
// version to another (any two, either way round)
router.get('/menu/versions/compare', allow('editMenu'), validate({ query: versionCompare }), async (req, res) => {
    const { from, to } = req.valid.query
    const found = await prisma.menuVersion.count({ where: { id: { in: [from, to] } } })
    if (found < new Set([from, to]).size) throw new HttpError(404, 'Menu version not found')
    const byVersion = await dishesByVersion([from, to])
    res.json({ from, to, changes: changesBetween(byVersion.get(from), byVersion.get(to)) })
})

// GET /api/taim/menu/versions/:id – one version with its categories and dishes
router.get('/menu/versions/:id', allow('editMenu'), validate({ params: idParams }), async (req, res) => {
    const version = await prisma.menuVersion.findUnique({
        where: { id: req.valid.params.id },
        select: {
            ...VERSION_SELECT,
            categories: {
                orderBy: { position: 'asc' },
                select: {
                    id: true,
                    name: true,
                    position: true,
                    items: {
                        orderBy: [{ position: 'asc' }, { id: 'asc' }],
                        select: { id: true, categoryId: true, name: true, description: true, price: true, prepMinutes: true, hidden: true, position: true },
                    },
                },
            },
        },
    })
    if (!version) throw new HttpError(404, 'Menu version not found')
    res.json(version)
})

// POST /api/taim/menu/versions { name, season?, note? } – start a draft: a
// copy of the menu in use to change. One at a time (409).
router.post('/menu/versions', allow('editMenu'), validate({ body: versionCreate }), async (req, res) => {
    res.status(201).json(await createDraft({ ...req.valid.body, staffId: req.staff.id }))
})

// PATCH /api/taim/menu/versions/:id { name?, season?, note? }
router.patch('/menu/versions/:id', allow('editMenu'), validate({ params: idParams, body: versionUpdate }), async (req, res) => {
    const { count } = await prisma.menuVersion.updateMany({ where: { id: req.valid.params.id }, data: req.valid.body })
    if (count === 0) throw new HttpError(404, 'Menu version not found')
    res.json(await prisma.menuVersion.findUniqueOrThrow({ where: { id: req.valid.params.id }, select: VERSION_SELECT }))
})

// DELETE /api/taim/menu/versions/:id – discard the draft (or a scheduled one)
router.delete('/menu/versions/:id', allow('editMenu'), validate({ params: idParams }), async (req, res) => {
    await discard(req.valid.params.id)
    res.status(204).end()
})

// POST /api/taim/menu/versions/:id/publish { startsAt? } (publishMenu)
// – the draft becomes the menu in use now, or from startsAt (scheduled)
router.post('/menu/versions/:id/publish', allow('publishMenu'), validate({ params: idParams, body: versionPublish }), async (req, res) => {
    res.json(await publishDraft({ id: req.valid.params.id, startsAt: req.valid.body.startsAt, staffId: req.staff.id }))
})

// POST /api/taim/menu/versions/:id/unschedule (publishMenu) – not after all:
// a scheduled menu goes back to being the draft
router.post('/menu/versions/:id/unschedule', allow('publishMenu'), validate({ params: idParams }), async (req, res) => {
    await unschedule(req.valid.params.id)
    res.status(204).end()
})

// POST /api/taim/menu/versions/:id/use (publishMenu) – an older menu is the
// menu in use again, from now (as a new version: "back from #2")
router.post('/menu/versions/:id/use', allow('publishMenu'), validate({ params: idParams }), async (req, res) => {
    res.json(await useAgain({ id: req.valid.params.id, staffId: req.staff.id }))
})

export default router
