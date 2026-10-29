import { z } from 'zod'

// POST /api/taim/session – pick who you are
export const sessionCreate = z.object({
    staffId: z.number({ error: 'Pick a staff member' }).int('Invalid staff id').positive('Invalid staff id'),
})
