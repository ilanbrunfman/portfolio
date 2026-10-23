import { Router } from 'express'
import { prisma } from '../db.js'

// GET /api/categories – all categories, income first, then by name
const router = Router()

router.get('/', async (req, res) => {
    const categories = await prisma.category.findMany({
        // Postgres sorts enums in declared order (INCOME, EXPENSE), not alphabetically
        orderBy: [{ kind: 'asc' }, { name: 'asc' }],
    })
    res.json(categories)
})

export default router
