import { prisma } from '../../../shared/db.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { RIGHTS } from '../roles.js'
import { SESSION_COOKIE, findSessionStaff } from '../services/sessions.js'

/**
 * Authentication: who are you? The session cookie (step 8.1: picked your
 * name and typed your PIN) → req.staff, and req.sessionToken for log out.
 * No session, an expired one, or someone who left → 401.
 */
export async function requireStaff(req, res, next) {
    const token = req.cookies?.[SESSION_COOKIE]
    const staff = await findSessionStaff(token)
    if (!staff) throw new HttpError(401, 'Pick who you are first')
    req.staff = staff
    req.sessionToken = token
    next()
}

/**
 * Authorization for changing an order's dishes: the right depends on the
 * kind of order – addDishes for a table (Manager, Waiter), takeoutOrders
 * for a take-out (Manager, Host, Waiter). Use after validate(), so
 * req.valid.params.id is a real id. Unknown order → 404, role → 403.
 */
export async function allowDishChanges(req, res, next) {
    const order = await prisma.order.findUnique({ where: { id: req.valid.params.id }, select: { type: true } })
    if (!order) throw new HttpError(404, 'Order not found')
    const roles = RIGHTS[order.type === 'TAKEOUT' ? 'takeoutOrders' : 'addDishes']
    if (!roles.includes(req.staff.role)) throw new HttpError(403, "Your role can't do this")
    next()
}

/**
 * Authorization: may you do this? Use after requireStaff:
 *   router.post('/menu-items', allow('editMenu'), …)
 * The role doesn't have the right → 403.
 */
export function allow(right) {
    const roles = RIGHTS[right]
    // A typo here is a bug in our code: fail when the server starts, not later
    if (!roles) throw new Error(`Unknown right "${right}"`)

    return (req, res, next) => {
        if (!roles.includes(req.staff.role)) throw new HttpError(403, "Your role can't do this")
        next()
    }
}
