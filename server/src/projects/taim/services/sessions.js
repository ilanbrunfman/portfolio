import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '../../../shared/db.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { hashPassword, verifyPassword } from '../../../shared/lib/password.js'

// Step 8.1: logging in to Ta'im is picking your name and typing your 4-digit
// PIN. The browser keeps a random token in a cookie; the database keeps only
// its SHA-256 hash (like the bank's sessions). A session lasts a long shift.

export const SESSION_COOKIE = 'taim_session'
const SESSION_HOURS = 14
export const MAX_WRONG_PINS = 5
export const LOCK_SECONDS = 60

const hashToken = (token) => createHash('sha256').update(token).digest('hex')

/** Cookie settings: not readable by page scripts, sent only to the Ta'im API, HTTPS-only in production */
export const sessionCookieOptions = (expires) => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/taim',
    ...(expires && { expires }),
})

/** A PIN → its stored hash (same scrypt as the bank's passwords) */
export const hashPin = (pin) => hashPassword(pin)

/**
 * Check a person's PIN. Wrong → 401 with the tries left; the 5th wrong in a
 * row locks them for a minute (429). Right → the count starts again.
 * Someone who left (inactive), or has no PIN yet → refused.
 */
export async function checkPin(staff, pin, now = new Date()) {
    if (!staff.active) throw new HttpError(403, `${staff.name} doesn't work here any more`)
    if (!staff.pinHash) throw new HttpError(409, `${staff.name} has no PIN yet: ask the Manager to set one`)
    if (staff.lockedUntil && staff.lockedUntil > now) {
        const seconds = Math.ceil((staff.lockedUntil - now) / 1000)
        throw new HttpError(429, `Too many wrong PINs: try again in ${seconds} s`)
    }
    if (await verifyPassword(pin, staff.pinHash)) {
        if (staff.failedPins > 0 || staff.lockedUntil) await prisma.staff.update({ where: { id: staff.id }, data: { failedPins: 0, lockedUntil: null } })
        return
    }
    // Wrong: count it (in the database, so it holds across devices)
    const failed = staff.lockedUntil && staff.lockedUntil <= now ? 1 : staff.failedPins + 1
    const locked = failed >= MAX_WRONG_PINS
    await prisma.staff.update({
        where: { id: staff.id },
        data: { failedPins: locked ? 0 : failed, lockedUntil: locked ? new Date(now.getTime() + LOCK_SECONDS * 1000) : null },
    })
    if (locked) throw new HttpError(429, `Too many wrong PINs: try again in ${LOCK_SECONDS} s`)
    const left = MAX_WRONG_PINS - failed
    throw new HttpError(401, `Wrong PIN: ${left} ${left === 1 ? 'try' : 'tries'} left`)
}

/**
 * Is this PIN free? PINs are unique among the people working here, so the
 * shared tablet can tell who typed it (step 8.2). Hashes are salted, so each
 * one is checked; a restaurant has a handful of people.
 */
export async function requireFreePin(pin, exceptStaffId = null) {
    const others = await prisma.staff.findMany({ where: { active: true, pinHash: { not: null }, ...(exceptStaffId && { id: { not: exceptStaffId } }) }, select: { pinHash: true } })
    for (const other of others) {
        if (await verifyPassword(pin, other.pinHash)) throw new HttpError(409, 'Someone else has this PIN: pick another', { fields: { pin: 'Someone else has this PIN: pick another' } })
    }
}

/** Start a session → { token, expiresAt } (token goes in the cookie) */
export async function createSession(staffId) {
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000)
    await prisma.staffSession.create({ data: { id: hashToken(token), staffId, expiresAt } })
    return { token, expiresAt }
}

/** The staff member for a cookie token, or null (missing, unknown, expired, or they left) */
export async function findSessionStaff(token) {
    if (!token) return null
    const session = await prisma.staffSession.findUnique({ where: { id: hashToken(token) }, include: { staff: true } })
    if (!session) return null
    if (session.expiresAt < new Date() || !session.staff.active) {
        await prisma.staffSession.delete({ where: { id: session.id } }).catch(() => {})
        return null
    }
    return session.staff
}

/** Log out: forget this session */
export async function deleteSession(token) {
    if (!token) return
    await prisma.staffSession.deleteMany({ where: { id: hashToken(token) } })
}

/** End a person's sessions (they left, or their PIN changed), except `keepToken`'s */
export async function endSessionsOf(staffId, keepToken = null) {
    await prisma.staffSession.deleteMany({ where: { staffId, ...(keepToken && { id: { not: hashToken(keepToken) } }) } })
}
