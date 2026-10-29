import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { STAFF_COOKIE, staffCookieOptions, requireStaff } from '../middleware/staff.js'
import { sessionCreate } from '../schemas/session.js'
import { permissionsFor } from '../roles.js'

// /api/taim/session – who is using Ta'im right now
const router = Router()

const toSessionJson = (staff) => ({
    staff: { id: staff.id, name: staff.name, role: staff.role },
    ...permissionsFor(staff.role),
})

// GET – the picked person, with the rights and screens of their role (401 if nobody)
router.get('/', requireStaff, (req, res) => {
    res.json(toSessionJson(req.staff))
})

// POST { staffId } – pick a person; the cookie remembers them
router.post('/', validate({ body: sessionCreate }), async (req, res) => {
    const staff = await prisma.staff.findUnique({ where: { id: req.valid.body.staffId } })
    if (!staff) throw new HttpError(404, 'Staff member not found')
    res.cookie(STAFF_COOKIE, String(staff.id), staffCookieOptions)
    res.json(toSessionJson(staff))
})

// DELETE – switch person: forget who was picked
router.delete('/', (req, res) => {
    res.clearCookie(STAFF_COOKIE, staffCookieOptions)
    res.status(204).end()
})

export default router
