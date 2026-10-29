import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '../../../shared/db.js'

export const SESSION_COOKIE = 'bank_session'
const SESSION_DAYS = 30

// The browser keeps a random token in a cookie; the database only stores its
// SHA-256 hash. Looking a session up = hash the cookie, find that row.
const hashToken = (token) => createHash('sha256').update(token).digest('hex')

/** Cookie settings: not readable by page scripts, sent only to the bank API, HTTPS-only in production */
export const cookieOptions = (expires) => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/bank',
    ...(expires && { expires }),
})

/** Start a session for a user → { token, expiresAt } (token goes in the cookie) */
export async function createSession(userId) {
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
    await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt } })
    return { token, expiresAt }
}

/** The user for a cookie token, or null (missing, unknown or expired) */
export async function findSessionUser(token) {
    if (!token) return null
    const session = await prisma.session.findUnique({ where: { id: hashToken(token) }, include: { user: true } })
    if (!session) return null
    if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
        return null
    }
    return session.user
}

/** Log out: forget this session */
export async function deleteSession(token) {
    if (!token) return
    await prisma.session.deleteMany({ where: { id: hashToken(token) } })
}

/** What the API sends about a user (never the password hash) */
export const toUserJson = (user) => ({ id: user.id, email: user.email })
