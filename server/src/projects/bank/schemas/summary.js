import { z } from 'zod'

// GET /api/bank/summary?month=2026-10 (defaults to the current month, UTC)
export const summaryQuery = z.object({
    month: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use a month like 2026-10')
        .default(() => new Date().toISOString().slice(0, 7)),
})
