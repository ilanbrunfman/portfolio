import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { summaryQuery } from '../schemas/summary.js'
import { getSummary } from '../services/summary.js'

// GET /api/summary?month=YYYY-MM – income, spending, by category, 6-month trend
const router = Router()

router.get('/', validate({ query: summaryQuery }), async (req, res) => {
    res.json(await getSummary(req.user.id, req.valid.query.month))
})

export default router
