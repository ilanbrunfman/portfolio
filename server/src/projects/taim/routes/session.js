import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { requireStaff } from '../middleware/staff.js'
import { sessionCreate } from '../schemas/session.js'
import { permissionsFor } from '../roles.js'
import { SESSION_COOKIE, checkPin, createSession, deleteSession, sessionCookieOptions } from '../services/sessions.js'

// /api/taim/session – who is using Ta'im on this device (step 8.1: name + PIN)
const router = Router()

const toSessionJson = (staff) => ({
    staff: { id: staff.id, name: staff.name, role: staff.role },
    ...permissionsFor(staff.role),
})

// GET – who is logged in, with the rights and screens of their role (401 if nobody)
router.get('/', requireStaff, (req, res) => {
    res.json(toSessionJson(req.staff))
})

// POST { staffId, pin } – log in: the right PIN starts a session (cookie).
// Wrong PIN 401 (tries left); 5 wrong in a row 429 for a minute; left 403;
// no PIN yet 409.
router.post('/', validate({ body: sessionCreate }), async (req, res) => {
    const { staffId, pin } = req.valid.body
    const staff = await prisma.staff.findUnique({ where: { id: staffId } })
    if (!staff) throw new HttpError(404, 'Staff member not found')
    await checkPin(staff, pin)
    // A new login on this device replaces the old one
    await deleteSession(req.cookies?.[SESSION_COOKIE])
    const { token, expiresAt } = await createSession(staff.id)
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(expiresAt))
    res.json(toSessionJson(staff))
})

// DELETE – switch person: end this device's session
router.delete('/', async (req, res) => {
    await deleteSession(req.cookies?.[SESSION_COOKIE])
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions())
    res.status(204).end()
})

export default router
