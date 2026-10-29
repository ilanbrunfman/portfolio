import { HttpError } from '../../../shared/lib/httpError.js'
import { SESSION_COOKIE, findSessionUser } from '../services/auth.js'

/**
 * Only lets logged-in requests through. Puts the user on req.user, so routes
 * can limit every query to that user's data (req.user.id).
 * Not logged in → 401.
 */
export async function requireAuth(req, res, next) {
    const user = await findSessionUser(req.cookies?.[SESSION_COOKIE])
    if (!user) throw new HttpError(401, 'Please log in')
    req.user = user
    next()
}
