import { HttpError } from '../../../shared/lib/httpError.js'

// Step 5.4: allergies. The Chef tags each dish's allergens; the waiter
// notes a guest's allergy on a seat of the bill (or, seat null, the whole
// table / the take-out). A dish that clashes is added only when the waiter
// confirms ("the kitchen will adapt it"), and the kitchen taps "Seen" on a
// ticket with allergies before it starts or serves it.

export const ALLERGENS = ['GLUTEN', 'DAIRY', 'EGG', 'PEANUTS', 'TREE_NUTS', 'SESAME', 'FISH', 'SHELLFISH', 'SOY']

/** "TREE_NUTS" → "tree nuts" */
export const allergenLabel = (allergen) => allergen.toLowerCase().replace('_', ' ')

/** What the seat select of the allergies on a bill needs */
export const ALLERGY_SELECT = { seat: true, allergens: true, note: true, notedBy: { select: { name: true } } }

/**
 * The allergies that matter for a dish on this bill, as one list of
 * allergens: its seat's and the whole table's; a shared dish (seat null)
 * at a table is eaten by everyone, so every seat's; a take-out has only
 * the whole-order row.
 * @param {{ seat: number|null, allergens: string[] }[]} allergies  The bill's rows.
 */
export function allergensFor(allergies, seat) {
    const rows = seat === null ? allergies : allergies.filter((row) => row.seat === null || row.seat === seat)
    return [...new Set(rows.flatMap((row) => row.allergens))]
}

/** What in the dish someone at its seat is allergic to ([] = no clash) */
export const clashOf = (dishAllergens, allergies, seat) => {
    const guest = allergensFor(allergies, seat)
    return dishAllergens.filter((allergen) => guest.includes(allergen))
}

/**
 * The allergy rows a kitchen ticket must show: the seats it cooks for and
 * the whole table; everyone's when it has a shared dish.
 * @param {{ seat: number|null }[]} dishes  The ticket's dishes.
 */
export function ticketAllergies(allergies, dishes) {
    if (dishes.some((dish) => dish.seat === null)) return allergies
    const seats = new Set(dishes.map((dish) => dish.seat))
    return allergies.filter((row) => row.seat === null || seats.has(row.seat))
}

/** "Seat 2: tree nuts, sesame (severe)" · "Whole table: gluten" */
export function allergyLine(row, type = 'TABLE') {
    const who = row.seat !== null ? `Seat ${row.seat}` : type === 'TAKEOUT' ? 'Take-out' : 'Whole table'
    const what = row.allergens.map(allergenLabel).join(', ')
    return `${who}: ${[what, row.note && (what ? `(${row.note})` : row.note)].filter(Boolean).join(' ')}`
}

/**
 * Before the kitchen starts or serves dishes of a ticket: if the ticket has
 * allergies, a cook must have tapped "Seen" (every dish of it seen). 409
 * otherwise, naming them.
 * @param {object} tx  Prisma (or a transaction).
 */
export async function requireAllergySeen(tx, orderId, round) {
    const [order, dishes] = await Promise.all([
        tx.order.findUnique({ where: { id: orderId }, select: { type: true, allergies: { select: ALLERGY_SELECT } } }),
        tx.orderItem.findMany({ where: { orderId, round, status: 'PREPARING' }, select: { seat: true, allergySeenAt: true } }),
    ])
    if (!order) return
    const rows = ticketAllergies(order.allergies, dishes)
    if (rows.length > 0 && dishes.some((dish) => !dish.allergySeenAt)) {
        throw new HttpError(409, `Allergy on this ticket: tap Seen first. ${rows.map((row) => allergyLine(row, order.type)).join(' · ')}`)
    }
}
