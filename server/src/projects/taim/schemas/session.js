import { z } from 'zod'

// A 4-digit PIN, as text so "0042" keeps its zeros (step 8.1)
export const pin = z.string({ error: 'Type the 4-digit PIN' }).regex(/^\d{4}$/, 'The PIN is 4 digits')

// POST /api/taim/session – pick who you are and type your PIN
export const sessionCreate = z.object({
    staffId: z.number({ error: 'Pick a staff member' }).int('Invalid staff id').positive('Invalid staff id'),
    pin,
})
