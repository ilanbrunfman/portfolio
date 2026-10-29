import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { credentials } from '../schemas/auth.js'
import { SESSION_COOKIE, cookieOptions, createSession, deleteSession, toUserJson } from '../services/auth.js'

const router = Router()

/** Create a session and put its token in the cookie */
async function logIn(res, user) {
    const { token, expiresAt } = await createSession(user.id)
    res.cookie(SESSION_COOKIE, token, cookieOptions(expiresAt))
}

// Used when the email doesn't exist, so a wrong email takes as long as a
// wrong password (the timing doesn't reveal which emails are registered)
const DUMMY_HASH = await hashPassword('not-a-real-password')

// POST /api/auth/signup → 201, logged in
router.post('/signup', validate({ body: credentials }), async (req, res) => {
    const { email, password } = req.valid.body
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new HttpError(409, 'An account with this email already exists. Log in instead.')

    const user = await prisma.user.create({ data: { email, passwordHash: await hashPassword(password) } })
    await logIn(res, user)
    res.status(201).json({ user: toUserJson(user) })
})

// POST /api/auth/login
router.post('/login', validate({ body: credentials }), async (req, res) => {
    const { email, password } = req.valid.body
    const user = await prisma.user.findUnique({ where: { email } })
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)
    // Same message either way: don't reveal whether the email exists
    if (!user || !ok) throw new HttpError(401, 'Email or password is incorrect')

    await logIn(res, user)
    res.json({ user: toUserJson(user) })
})

// POST /api/auth/logout → 204
router.post('/logout', async (req, res) => {
    await deleteSession(req.cookies?.[SESSION_COOKIE])
    res.clearCookie(SESSION_COOKIE, cookieOptions())
    res.status(204).end()
})

// GET /api/auth/me – who's logged in (401 if nobody)
router.get('/me', requireAuth, (req, res) => {
    res.json({ user: toUserJson(req.user) })
})

export default router
