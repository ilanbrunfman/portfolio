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
            }),
            { error: 'Pick at least one dish' }
        )
        .min(1, 'Pick at least one dish'),
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
