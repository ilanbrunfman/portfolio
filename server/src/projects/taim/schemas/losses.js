import { z } from 'zod'

// GET /api/taim/losses?from=<ISO>&to=<ISO> – returns in that time (the client
// sends the start and end of the year or month in its own time zone)
export const lossesQuery = z
    .object({
        from: z.coerce.date({ error: 'From must be a date' }),
        to: z.coerce.date({ error: 'To must be a date' }),
    })
    .refine((query) => query.from < query.to, 'From must be before To')
