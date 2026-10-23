import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

// Password hashing with Node's built-in scrypt (no extra library).
// Stored format: "scrypt$<salt>$<hash>" (base64url). The random salt makes
// the same password hash differently for every user; scrypt is deliberately
// slow, so guessing passwords from a leaked database is expensive.

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64

/** @param {string} password */
export async function hashPassword(password) {
    const salt = randomBytes(16)
    const hash = await scrypt(password, salt, KEY_LENGTH)
    return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`
}

/**
 * @param {string} password  what the user typed
 * @param {string} stored    the saved "scrypt$salt$hash"
 */
export async function verifyPassword(password, stored) {
    const [algorithm, salt, hash] = stored.split('$')
    if (algorithm !== 'scrypt' || !salt || !hash) return false
    const expected = Buffer.from(hash, 'base64url')
    const actual = await scrypt(password, Buffer.from(salt, 'base64url'), expected.length)
    // Constant-time comparison: takes as long whether the first or last byte differs
    return timingSafeEqual(actual, expected)
}
