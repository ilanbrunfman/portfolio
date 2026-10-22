import { Router } from 'express'
import { prisma } from '../db.js'

// GET /api/health – is the server up, and can it reach the database?
const router = Router()

router.get('/', async (req, res) => {
    let db = 'ok'
    try {
        await prisma.$queryRaw`SELECT 1`
    } catch {
        db = 'unreachable'
    }
    res.status(db === 'ok' ? 200 : 503).json({ status: 'ok', db, time: new Date().toISOString() })
})

export default router
