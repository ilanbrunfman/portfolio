import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { idParams } from '../../../shared/schemas/common.js'
import { allow } from '../middleware/staff.js'
import { categoryCreate, categoryUpdate, menuItemCreate, menuItemUpdate } from '../schemas/menu.js'

// The menu: categories and dishes. Everyone picked can read it;
// changing it needs the editMenu right (Manager, Chef).
const router = Router()

const DISH_FIELDS = { id: true, categoryId: true, name: true, description: true, price: true, hidden: true }

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

// GET /api/taim/menu – categories in menu order, each with its dishes
// (hidden ones too, marked hidden: the editor shows them, the order screen doesn't)
router.get('/menu', async (req, res) => {
    const categories = await prisma.menuCategory.findMany({
        orderBy: { position: 'asc' },
        select: { id: true, name: true, position: true, items: { select: DISH_FIELDS, orderBy: { id: 'asc' } } },
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
router.post('/menu-items', allow('editMenu'), validate({ body: menuItemCreate }), async (req, res) => {
    await requireCategory(req.valid.body.categoryId)
    const dish = await prisma.menuItem
        .create({ data: req.valid.body, select: DISH_FIELDS })
        .catch((err) => nameTaken(err, 'There is already a dish with this name'))
    res.status(201).json(dish)
})

// PATCH /api/taim/menu-items/:id – any of the fields; { hidden: true } = sold out
router.patch('/menu-items/:id', allow('editMenu'), validate({ params: idParams, body: menuItemUpdate }), async (req, res) => {
    if (req.valid.body.categoryId) await requireCategory(req.valid.body.categoryId)
    const dish = await prisma.menuItem
        .update({ where: { id: req.valid.params.id }, data: req.valid.body, select: DISH_FIELDS })
        .catch((err) => nameTaken(err, 'There is already a dish with this name'))
    res.json(dish)
})

export default router
