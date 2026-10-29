import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { ROLES } from '../roles.js'

// /api/taim/staff – the people on the "Who are you?" screen (public)
const router = Router()

router.get('/', async (req, res) => {
    const staff = await prisma.staff.findMany({ select: { id: true, name: true, role: true } })
    // Manager first, then Chef, Cook, Host, Waiter; same role → by name
    staff.sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || a.name.localeCompare(b.name))
    res.json(staff)
})

export default router
