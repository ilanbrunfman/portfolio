import { z } from 'zod'

// GET /api/accounts/:id/transactions?limit=50&cursor=2026-10-01_123
export const ledgerQuery = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    cursor: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}_\d+$/, 'Invalid cursor')
        .transform((value) => {
            const [date, id] = value.split('_')
            return { date, id: Number(id) }
        })
        .optional(),
})

// Reused by create and update
const fields = {
    accountId: z.number({ error: 'Account is required' }).int().positive(),
    date: z.iso.date({ error: 'Use a date like 2026-10-22' }),
    amount: z
        .number({ error: 'Amount is required' })
        .int('Use whole cents')
        .refine((cents) => cents !== 0, "Amount can't be zero"),
    description: z
        .string({ error: 'Description is required' })
        .trim()
        .min(1, 'Description is required')
        .max(120, 'Max 120 characters'),
    categoryId: z.number().int().positive().nullable(),
    // Empty note → null
    note: z
        .string()
        .trim()
        .max(500, 'Max 500 characters')
        .transform((text) => text || null)
        .nullable(),
}

// POST /api/transactions
export const transactionCreate = z.object({
    accountId: fields.accountId,
    date: fields.date,
    amount: fields.amount,
    description: fields.description,
    categoryId: fields.categoryId.optional(),
    note: fields.note.optional(),
})

// PATCH /api/transactions/:id – any subset (moving to another account isn't supported)
export const transactionUpdate = z
    .object({
        date: fields.date,
        amount: fields.amount,
        description: fields.description,
        categoryId: fields.categoryId,
        note: fields.note,
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, 'Nothing to update')
