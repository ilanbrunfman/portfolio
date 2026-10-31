import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { idParams } from '../../../shared/schemas/common.js'
import { allow } from '../middleware/staff.js'
import { categoryCreate, categoryUpdate, menuItemCreate, menuItemUpdate, dishOrder } from '../schemas/menu.js'
import { activeVersion, requireDraft } from '../services/menuVersions.js'

// The menu: categories and dishes. Everyone picked can read the menu in use
// (the ACTIVE version); changing it needs the editMenu right (Manager, Chef)
// and happens in the DRAFT version, which goes live when it's published
// (routes/menuVersions.js). The one change made on the menu in use is sold
// out (hidden): that's day to day, not a new version.
const router = Router()

/** The draft must exist and hold this category (404 / 409 otherwise) */
async function requireDraftCategory(categoryId, field = null) {
    const draft = await requireDraft()
    const category = await prisma.menuCategory.findUnique({ where: { id: categoryId }, select: { id: true, versionId: true, items: { select: { id: true } } } })
    if (!category) {
        if (field) throw new HttpError(400, 'Validation failed', { fields: { [field]: 'Category not found' } })
        throw new HttpError(404, 'Category not found')
    }
    if (category.versionId !== draft.id) throw new HttpError(409, 'Change the draft: the menu in use changes only when a draft is published')
    return { draft, category }
}

const DISH_FIELDS = { id: true, categoryId: true, name: true, description: true, price: true, prepMinutes: true, hidden: true, allergens: true, position: true }
const DISH_ORDER = [{ position: 'asc' }, { id: 'asc' }]

/** Prisma's "unique value already used" error → 409 with a message under the Name input */
function nameTaken(err, message) {
    if (err.code === 'P2002') throw new HttpError(409, message, { fields: { name: message } })
    throw err
}

/**
 * Make room at the top of a category: every dish there moves down one.
 * Run inside a transaction together with the write that takes position 1.
 */
const makeRoomAtTop = (tx, categoryId) =>
    tx.menuItem.updateMany({ where: { categoryId }, data: { position: { increment: 1 } } })

// GET /api/taim/menu – the menu in use: categories in menu order, each with
// its dishes in order (hidden ones too, marked hidden: the editor shows them,
// the order screen doesn't)
router.get('/menu', async (req, res) => {
    const version = await activeVersion()
    const categories = await prisma.menuCategory.findMany({
        where: { versionId: version.id },
        orderBy: { position: 'asc' },
        select: { id: true, name: true, position: true, items: { select: DISH_FIELDS, orderBy: DISH_ORDER } },
    })
    res.json(categories)
})

// POST /api/taim/categories { name } – added at the end of the draft's menu
router.post('/categories', allow('editMenu'), validate({ body: categoryCreate }), async (req, res) => {
    const draft = await requireDraft()
    const last = await prisma.menuCategory.aggregate({ where: { versionId: draft.id }, _max: { position: true } })
    const category = await prisma.menuCategory
        .create({ data: { versionId: draft.id, name: req.valid.body.name, position: (last._max.position ?? 0) + 1 } })
        .catch((err) => nameTaken(err, 'There is already a category with this name'))
    res.status(201).json({ ...category, items: [] })
})

// PATCH /api/taim/categories/:id { name } – a draft category
router.patch('/categories/:id', allow('editMenu'), validate({ params: idParams, body: categoryUpdate }), async (req, res) => {
    await requireDraftCategory(req.valid.params.id)
    const category = await prisma.menuCategory
        .update({ where: { id: req.valid.params.id }, data: req.valid.body })
        .catch((err) => nameTaken(err, 'There is already a category with this name'))
    res.json(category)
})

// DELETE /api/taim/categories/:id – an empty draft category
router.delete('/categories/:id', allow('editMenu'), validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params
    const { category } = await requireDraftCategory(id)
    if (category.items.length > 0) throw new HttpError(409, 'Only an empty category can be deleted. Move its dishes first.')
    await prisma.menuCategory.delete({ where: { id } })
    res.status(204).end()
})

// POST /api/taim/menu-items { categoryId, name, description?, price, hidden? }
// A new dish in a draft category, at the top of it.
router.post('/menu-items', allow('editMenu'), validate({ body: menuItemCreate }), async (req, res) => {
    const data = req.valid.body
    const { draft } = await requireDraftCategory(data.categoryId, 'categoryId')
    // Both writes or neither: no gap at the top if the create fails
    const dish = await prisma
        .$transaction(async (tx) => {
            await makeRoomAtTop(tx, data.categoryId)
            return tx.menuItem.create({ data: { ...data, versionId: draft.id, position: 1 }, select: DISH_FIELDS })
        })
        .catch((err) => nameTaken(err, 'There is already a dish with this name'))
    res.status(201).json(dish)
})

// PATCH /api/taim/menu-items/:id – a draft dish: any of the fields (moving
// it to another category puts it at the top there). A dish of the menu in
// use: only { hidden } – sold out, or back on – and { allergens }: safety
// information is fixed at once, not in the next version.
router.patch('/menu-items/:id', allow('editMenu'), validate({ params: idParams, body: menuItemUpdate }), async (req, res) => {
    const { id } = req.valid.params
    const data = req.valid.body
    const current = await prisma.menuItem.findUnique({ where: { id }, select: { categoryId: true, version: { select: { status: true } } } })
    if (!current) throw new HttpError(404, 'Dish not found')

    const liveChange = Object.keys(data).every((key) => key === 'hidden' || key === 'allergens')
    if (current.version.status === 'ACTIVE' && !liveChange) {
        throw new HttpError(409, 'Change the draft: on the menu in use only sold out and allergens can change')
    }
    if (current.version.status !== 'ACTIVE' && current.version.status !== 'DRAFT') throw new HttpError(409, 'This menu version can no longer change')

    const moving = data.categoryId !== undefined && data.categoryId !== current.categoryId
    if (moving) await requireDraftCategory(data.categoryId, 'categoryId')

    const dish = await prisma
        .$transaction(async (tx) => {
            if (moving) await makeRoomAtTop(tx, data.categoryId)
            return tx.menuItem.update({ where: { id }, data: moving ? { ...data, position: 1 } : data, select: DISH_FIELDS })
        })
        .catch((err) => nameTaken(err, 'There is already a dish with this name'))
    res.json(dish)
})

// DELETE /api/taim/menu-items/:id – take a dish off the draft (it won't be
// on the next menu). Dishes of the menu in use or older menus stay: bills
// point at them; on the menu in use, sold out hides a dish instead.
router.delete('/menu-items/:id', allow('editMenu'), validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params
    const dish = await prisma.menuItem.findUnique({ where: { id }, select: { version: { select: { status: true } } } })
    if (!dish) throw new HttpError(404, 'Dish not found')
    if (dish.version.status !== 'DRAFT') throw new HttpError(409, 'Only a dish of the draft can be removed: on the menu in use, mark it sold out')
    await prisma.menuItem.delete({ where: { id } })
    res.status(204).end()
})

// PUT /api/taim/categories/:id/dish-order { dishIds } – the new order after a
// drag, top first. The list must be exactly this category's dishes.
router.put('/categories/:id/dish-order', allow('editMenu'), validate({ params: idParams, body: dishOrder }), async (req, res) => {
    const { id } = req.valid.params
    const { dishIds } = req.valid.body
    const { category } = await requireDraftCategory(id)

    const current = new Set(category.items.map((item) => item.id))
    if (dishIds.length !== current.size || !dishIds.every((dishId) => current.has(dishId))) {
        throw new HttpError(400, 'Send every dish of this category exactly once', {
            fields: { dishIds: 'Send every dish of this category exactly once' },
        })
    }

    // All positions change together or not at all (one transaction)
    await prisma.$transaction(
        dishIds.map((dishId, index) => prisma.menuItem.update({ where: { id: dishId }, data: { position: index + 1 } }))
    )
    const items = await prisma.menuItem.findMany({ where: { categoryId: id }, select: DISH_FIELDS, orderBy: DISH_ORDER })
    res.json(items)
})

export default router
