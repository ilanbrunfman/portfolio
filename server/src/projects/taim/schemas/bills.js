import { z } from 'zod'

// GET /api/taim/bills – which bills to review:
//   period=today   today's bills: everything since the last "Close the day"
//   from=<ISO>     bills opened since then (the client sends the start of
//                  this week, month or year in the restaurant's time zone)
// status narrows the list (the totals always cover every bill of the period).
export const billsQuery = z
    .object({
        period: z.enum(['today'], { error: 'Period must be "today"' }).optional(),
        from: z.coerce.date({ error: 'From must be a date' }).optional(),
        status: z.enum(['ALL', 'OPEN', 'CLOSED'], { error: 'Status must be ALL, OPEN or CLOSED' }).default('ALL'),
    })
    .refine((query) => Boolean(query.period) !== Boolean(query.from), 'Give either period=today or from')
