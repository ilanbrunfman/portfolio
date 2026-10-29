import { prisma } from '../../../shared/db.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { RIGHTS } from '../roles.js'

/** The cookie that remembers who was picked on "Who are you?" */
export const STAFF_COOKIE = 'taim_staff'

/**
 * Cookie settings: not readable by page scripts, sent only to the Ta'im API.
 * It holds the staff id. There are no passwords in Ta'im (picking a person
 * is the login), so the point isn't secrecy: it's that the server, not the
 * page, decides what that person's role may do.
 */
export const staffCookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/taim',
}

/**
 * Authentication: who are you? Loads the picked staff member onto
 * req.staff. Nobody picked (or they no longer exist) → 401.
 */
export async function requireStaff(req, res, next) {
    const id = Number(req.cookies?.[STAFF_COOKIE])
    const staff = Number.isInteger(id) && id > 0 ? await prisma.staff.findUnique({ where: { id } }) : null
    if (!staff) throw new HttpError(401, 'Pick who you are first')
    req.staff = staff
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
