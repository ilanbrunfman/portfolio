import { z } from 'zod'
import { allergenList } from './menu.js'

const positiveInt = (message) => z.number({ error: message }).int(message).positive(message)

// ---------- tables ----------

const tableFields = {
    label: z.string({ error: 'Label is required' }).trim().min(1, 'Label is required').max(10, 'Max 10 characters'),
    seats: positiveInt('Seats must be a whole number above 0').max(30, 'Max 30 seats'),
}

// POST /api/taim/tables – goes to the end of the floor
export const tableCreate = z.object(tableFields)

// PATCH /api/taim/tables/:id
export const tableUpdate = z
    .object(tableFields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, 'Nothing to update')

// POST /api/taim/tables/combine – two or more free, clean tables become one
export const tablesCombine = z.object({
    tableIds: z
        .array(positiveInt('Invalid table'), { error: 'Pick the tables to combine' })
        .min(2, 'Pick at least two tables')
        .refine((ids) => new Set(ids).size === ids.length, 'Each table can be picked only once'),
})

// ---------- orders ----------

// POST /api/taim/orders – seat a table, or start a take-out
export const orderCreate = z.discriminatedUnion(
    'type',
    [
        z.object({
            type: z.literal('TABLE'),
            tableId: positiveInt('Pick a table'),
            guests: positiveInt('Guests must be a whole number above 0').max(50, 'Max 50 guests'),
        }),
        z.object({
            type: z.literal('TAKEOUT'),
            customerName: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(40, 'Max 40 characters'),
            // Optional, to call when it's ready. If given: digits, spaces and
            // dashes, an optional + in front. Empty → saved as no phone.
            customerPhone: z
                .string({ error: 'Enter a phone number, e.g. 050-123-4567' })
                .trim()
                .refine((phone) => phone === '' || /^\+?\d[\d -]{5,18}\d$/.test(phone), 'Enter a phone number, e.g. 050-123-4567')
                .nullable()
                .optional()
                .transform((phone) => phone || null),
        }),
    ],
    { error: 'Type must be TABLE or TAKEOUT' }
)

// POST /api/taim/orders/:id/items – dishes to add, e.g. [{ menuItemId: 4, quantity: 2 }]
export const orderItemsAdd = z.object({
    items: z
        .array(
            z.object({
                menuItemId: positiveInt('Invalid dish'),
                quantity: positiveInt('Quantity must be a whole number above 0').max(20, 'Max 20 at a time').default(1),
                // Which guest gets it (1…guests); null or missing = shared / take-out
                seat: positiveInt('Seat must be a whole number above 0').nullable().default(null),
                // The guest takes it home: packed, on the same bill (tables only)
                toGo: z.boolean({ error: 'To go must be true or false' }).default(false),
                // Step 5.4: added although it clashes with the seat's allergy
                // (the waiter was warned and confirmed)
                allergyConfirmed: z.boolean({ error: 'Must be true or false' }).default(false),
            }),
            { error: 'Pick at least one dish' }
        )
        .min(1, 'Pick at least one dish'),
})

// PATCH /api/taim/orders/:id – fix a seating: another table and/or guest count
export const orderUpdate = z
    .object({
        tableId: positiveInt('Pick a table'),
        guests: positiveInt('Guests must be a whole number above 0').max(50, 'Max 50 guests'),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, 'Nothing to update')

// PATCH /api/taim/orders/:id/items/:itemId – move a dish to another seat (null = shared)
// PATCH /api/taim/orders/:id/items/:itemId – another seat, and/or to go or not
export const orderItemUpdate = z
    .object({
        seat: positiveInt('Seat must be a whole number above 0').nullable().optional(),
        toGo: z.boolean({ error: 'To go must be true or false' }).optional(),
        // Moving it to a seat whose allergy it clashes with needs this
        allergyConfirmed: z.boolean({ error: 'Must be true or false' }).default(false),
    })
    .refine((data) => data.seat !== undefined || data.toGo !== undefined, 'Nothing to update')

const note = z
    .string({ error: 'Note must be text' })
    .trim()
    .max(200, 'Max 200 characters')
    .transform((text) => text || null)
    .nullable()
    .default(null)

// POST /api/taim/orders/:id/items/:itemId/came-back – why, and what now:
// fix the same plate (fix: cook it more, more spice – still charged), or
// give something instead, on the house: the same dish again (remake),
// another dish (replaceWithId, e.g. a dessert), or nothing. sendNow: the free dish
// goes straight to the kitchen (default), or waits on the bill as not sent
// (a dessert for later).
export const RETURN_REASONS = ['COLD', 'WRONG_DISH', 'TASTE', 'UNDERCOOKED', 'ALLERGY', 'TOO_SLOW', 'OTHER']
export const cameBack = z
    .object({
        reason: z.enum(RETURN_REASONS, { error: 'Pick a reason' }),
        note,
        fix: z.boolean({ error: 'Fix must be true or false' }).default(false),
        remake: z.boolean({ error: 'Remake must be true or false' }).default(false),
        replaceWithId: z.number({ error: 'Invalid dish' }).int('Invalid dish').positive('Invalid dish').nullable().default(null),
        sendNow: z.boolean({ error: 'Send now must be true or false' }).default(true),
    })
    .refine((body) => [body.fix, body.remake, Boolean(body.replaceWithId)].filter(Boolean).length <= 1, 'Pick one: fix it, make it again or another dish')

// POST /api/taim/orders/:id/items/:itemId/waste – food lost without a guest
// giving it back: CANCELLED (the guest cancelled after the kitchen started
// it) or DROPPED (on the way; remake = make it again, charged as usual since
// the guest never got it)
export const WASTE_REASONS = ['CANCELLED', 'DROPPED']
export const waste = z.object({
    reason: z.enum(WASTE_REASONS, { error: 'Pick a reason' }),
    note,
    remake: z.boolean({ error: 'Remake must be true or false' }).default(false),
})

// POST /api/taim/order-items/:id/redo – the kitchen made it wrong: { note? }
export const redo = z.object({ note })

// POST /api/taim/orders/:id/send { itemIds? } – which dishes not sent yet go
// now; the others are put on hold. No itemIds = every dish not sent yet.
// Also POST /orders/:id/hold { itemIds? }: which to hold (none = all waiting).
export const orderSend = z.object({
    itemIds: z
        .array(positiveInt('Invalid dish'), { error: 'Pick the dishes to send' })
        .min(1, 'Pick at least one dish to send')
        .max(200, 'Too many dishes')
        .optional(),
})

// GET /api/taim/orders?status=OPEN|CLOSED
export const orderListQuery = z.object({
    status: z.enum(['OPEN', 'CLOSED'], { error: 'Status must be OPEN or CLOSED' }).default('OPEN'),
})

// /api/taim/orders/:id/items/:itemId
export const orderItemParams = z.object({
    id: z.coerce.number({ error: 'Invalid id' }).int('Invalid id').positive('Invalid id'),
    itemId: z.coerce.number({ error: 'Invalid id' }).int('Invalid id').positive('Invalid id'),
})

// PUT /api/taim/orders/:id/allergies – a guest's allergy on the bill
// (step 5.4): for a seat, or (seat null) the whole table / the take-out.
// No allergens and no note = remove it.
export const seatAllergy = z.object({
    seat: z.number({ error: 'Seat must be a number' }).int('Seat must be a whole number').positive('Seat must be a whole number above 0').nullable().default(null),
    allergens: allergenList.default([]),
    note: z.string({ error: 'Note must be text' }).trim().max(200, 'Max 200 characters').transform((text) => text || null).nullable().default(null),
})
