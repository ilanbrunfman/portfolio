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
