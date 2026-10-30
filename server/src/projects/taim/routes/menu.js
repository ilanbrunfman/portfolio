import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { idParams } from '../../../shared/schemas/common.js'
import { allow } from '../middleware/staff.js'
import { categoryCreate, categoryUpdate, menuItemCreate, menuItemUpdate, dishOrder } from '../schemas/menu.js'

// The menu: categories and dishes. Everyone picked can read it;
// changing it needs the editMenu right (Manager, Chef).
const router = Router()

const DISH_FIELDS = { id: true, categoryId: true, name: true, description: true, price: true, prepMinutes: true, hidden: true, position: true }
const DISH_ORDER = [{ position: 'asc' }, { id: 'asc' }]

/** Prisma's "unique value already used" error → 409 with a message under the Name input */
function nameTaken(err, message) {
    if (err.code === 'P2002') throw new HttpError(409, message, { fields: { name: message } })
    throw err
}

/** 400 under the category input if it doesn't exist */
async function requireCategory(categoryId) {
    const category = await prisma.menuCategory.findUnique({ where: { id: categoryId } })
    if (!category) throw new HttpError(400, 'Validation failed', { fields: { categoryId: 'Category not found' } })
}

/**
 * Make room at the top of a category: every dish there moves down one.
 * Run inside a transaction together with the write that takes position 1.
 */
const makeRoomAtTop = (tx, categoryId) =>
    tx.menuItem.updateMany({ where: { categoryId }, data: { position: { increment: 1 } } })

// GET /api/taim/menu – categories in menu order, each with its dishes in order
// (hidden ones too, marked hidden: the editor shows them, the order screen doesn't)
router.get('/menu', async (req, res) => {
    const categories = await prisma.menuCategory.findMany({
        orderBy: { position: 'asc' },
        select: { id: true, name: true, position: true, items: { select: DISH_FIELDS, orderBy: DISH_ORDER } },
    })
    res.json(categories)
})

// POST /api/taim/categories { name } – added at the end of the menu
router.post('/categories', allow('editMenu'), validate({ body: categoryCreate }), async (req, res) => {
    const last = await prisma.menuCategory.aggregate({ _max: { position: true } })
    const category = await prisma.menuCategory
        .create({ data: { name: req.valid.body.name, position: (last._max.position ?? 0) + 1 } })
        .catch((err) => nameTaken(err, 'There is already a category with this name'))
    res.status(201).json({ ...category, items: [] })
})

// PATCH /api/taim/categories/:id { name }
router.patch('/categories/:id', allow('editMenu'), validate({ params: idParams, body: categoryUpdate }), async (req, res) => {
    const category = await prisma.menuCategory
        .update({ where: { id: req.valid.params.id }, data: req.valid.body })
        .catch((err) => nameTaken(err, 'There is already a category with this name'))
    res.json(category)
})

// DELETE /api/taim/categories/:id – only an empty one (dishes are never deleted)
router.delete('/categories/:id', allow('editMenu'), validate({ params: idParams }), async (req, res) => {
    const { id } = req.valid.params
    const dishes = await prisma.menuItem.count({ where: { categoryId: id } })
    if (dishes > 0) throw new HttpError(409, 'Only an empty category can be deleted. Move its dishes first.')
    await prisma.menuCategory.delete({ where: { id } })
    res.status(204).end()
})

// POST /api/taim/menu-items { categoryId, name, description?, price, hidden? }
// The new dish goes to the top of its category.
router.post('/menu-items', allow('editMenu'), validate({ body: menuItemCreate }), async (req, res) => {
    const data = req.valid.body
    await requireCategory(data.categoryId)
    // Both writes or neither: no gap at the top if the create fails
    const dish = await prisma
        .$transaction(async (tx) => {
            await makeRoomAtTop(tx, data.categoryId)
            return tx.menuItem.create({ data: { ...data, position: 1 }, select: DISH_FIELDS })
        })
        .catch((err) => nameTaken(err, 'There is already a dish with this name'))
    res.status(201).json(dish)
})

// PATCH /api/taim/menu-items/:id – any of the fields; { hidden: true } = sold out.
// Moving a dish to another category puts it at the top there.
router.patch('/menu-items/:id', allow('editMenu'), validate({ params: idParams, body: menuItemUpdate }), async (req, res) => {
    const { id } = req.valid.params
    const data = req.valid.body
    const current = await prisma.menuItem.findUnique({ where: { id }, select: { categoryId: true } })
    if (!current) throw new HttpError(404, 'Dish not found')

    const moving = data.categoryId !== undefined && data.categoryId !== current.categoryId
    if (moving) await requireCategory(data.categoryId)

    const dish = await prisma
        .$transaction(async (tx) => {
            if (moving) await makeRoomAtTop(tx, data.categoryId)
            return tx.menuItem.update({ where: { id }, data: moving ? { ...data, position: 1 } : data, select: DISH_FIELDS })
        })
        .catch((err) => nameTaken(err, 'There is already a dish with this name'))
    res.json(dish)
})

// PUT /api/taim/categories/:id/dish-order { dishIds } – the new order after a
// drag, top first. The list must be exactly this category's dishes.
router.put('/categories/:id/dish-order', allow('editMenu'), validate({ params: idParams, body: dishOrder }), async (req, res) => {
    const { id } = req.valid.params
    const { dishIds } = req.valid.body
    const category = await prisma.menuCategory.findUnique({ where: { id }, select: { items: { select: { id: true } } } })
    if (!category) throw new HttpError(404, 'Category not found')

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
