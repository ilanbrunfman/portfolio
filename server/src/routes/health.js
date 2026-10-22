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
    const body = { status: 'ok', db, time: new Date().toISOString() }
    if (db === 'ok') return res.json(body)
    res.status(503).json({ ...body, error: 'Database unreachable' })
})

export default router
