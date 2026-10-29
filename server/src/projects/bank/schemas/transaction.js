import { z } from 'zod'

const isDay = (value) => z.iso.date().safeParse(value).success
const isId = (value) => Number.isInteger(value) && value > 0

// GET /api/bank/accounts/:id/transactions
//   ?limit=50&cursor=2026-10-01_123            paging
//   &q=coffee&type=expense&categoryId=6        filters (all optional)
//   &from=2026-10-01&to=2026-10-31
export const ledgerQuery = z
    .object({
        limit: z.coerce.number().int().min(1).max(200).default(50),
        cursor: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}_\d+$/, 'Invalid cursor')
            .transform((value) => {
                const [date, id] = value.split('_')
                return { date, id: Number(id) }
            })
            .optional(),
        q: z.string().trim().max(100).optional().transform((v) => v || undefined),
        type: z.enum(['income', 'expense', 'transfer']).optional(),
        categoryId: z.coerce.number().int().positive().optional(),
        from: z.iso.date({ error: 'Use a date like 2026-10-01' }).optional(),
        to: z.iso.date({ error: 'Use a date like 2026-10-31' }).optional(),
    })
    .refine((f) => !f.from || !f.to || f.from <= f.to, {
        message: "'from' must be before 'to'",
        path: ['to'],
        // Zod skips object-level checks when any field is invalid; run this
        // one anyway as long as the two dates themselves are fine, so all
        // errors come back in one response
        when: ({ value }) => isDay(value?.from ?? '') && isDay(value?.to ?? ''),
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

// POST /api/bank/transactions
export const transactionCreate = z.object({
    accountId: fields.accountId,
    date: fields.date,
    amount: fields.amount,
    description: fields.description,
    categoryId: fields.categoryId.optional(),
    note: fields.note.optional(),
})

// PATCH /api/bank/transactions/:id – any subset (moving to another account isn't supported)
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

// ---------- transfers ----------

const transferFields = {
    fromAccountId: z.number({ error: 'Pick the account the money leaves' }).int().positive(),
    toAccountId: z.number({ error: 'Pick the account the money goes to' }).int().positive(),
    // Always positive: the direction comes from from/to
    amount: z.number({ error: 'Amount is required' }).int('Use whole cents').positive('Amount must be more than 0'),
    date: fields.date,
    description: fields.description,
    note: fields.note,
}

const differentAccounts = (data) =>
    data.fromAccountId === undefined || data.toAccountId === undefined || data.fromAccountId !== data.toAccountId

// Same check, run even when other fields (amount, date…) are invalid
const differentAccountsCheck = {
    message: 'Pick two different accounts',
    path: ['toAccountId'],
    when: ({ value }) => isId(value?.fromAccountId) && isId(value?.toAccountId),
}

// POST /api/bank/transfers
export const transferCreate = z
    .object({
        ...transferFields,
        description: transferFields.description.default('Transfer'),
        note: transferFields.note.optional(),
    })
    .refine(differentAccounts, differentAccountsCheck)

// PATCH /api/bank/transfers/:transferId – any subset
export const transferUpdate = z
    .object(transferFields)
    .partial()
    .refine((data) => Object.keys(data).length > 0, 'Nothing to update')
    .refine(differentAccounts, differentAccountsCheck)

export const transferParams = z.object({
    transferId: z.uuid({ error: 'Invalid transfer id' }),
})
