import { z } from 'zod'

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
export const orderItemUpdate = z.object({
    seat: positiveInt('Seat must be a whole number above 0').nullable(),
})

// POST /api/taim/orders/:id/send { itemIds? } – which dishes not sent yet go
// now; the others are put on hold. No itemIds = every dish not sent yet.
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
