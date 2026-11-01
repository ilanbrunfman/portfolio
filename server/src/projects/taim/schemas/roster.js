import { z } from 'zod'
import { ROLES } from '../roles.js'
import { pin } from './session.js'

// Step 8.1: the roster (Manager only)

const fields = {
    name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(40, 'Max 40 characters'),
    role: z.enum(ROLES, { error: 'Pick a role' }),
    // Empty = none
    phone: z
        .string({ error: 'Phone must be text' })
        .trim()
        .max(20, 'Max 20 characters')
        .regex(/^[0-9+\-\s()]*$/, 'Digits, spaces, + - ( ) only')
        .transform((text) => text || null)
        .nullable(),
    // Cents per hour (4500 = $45.00); null = not set
    hourlyRate: z.number({ error: 'Rate must be a number of cents' }).int('Use whole cents').min(0, "Rate can't be negative").max(100_000, 'Max $1,000.00 an hour').nullable(),
    // "2026-03-01"
    startDate: z.iso.date({ error: 'Start date must be a date (YYYY-MM-DD)' }).transform((text) => new Date(`${text}T00:00:00Z`)).nullable(),
}

// POST /api/taim/roster – a new person, with their first PIN
export const rosterCreate = z.object({
    name: fields.name,
    role: fields.role,
    phone: fields.phone.default(null),
    hourlyRate: fields.hourlyRate.default(null),
    startDate: fields.startDate.default(null),
    pin,
})

// PATCH /api/taim/roster/:id – any of the fields; active: false = they left
export const rosterUpdate = z
    .object({ ...fields, active: z.boolean({ error: 'Active must be true or false' }) })
    .partial()
    .refine((data) => Object.keys(data).length > 0, 'Nothing to update')

// PUT /api/taim/roster/:id/pin – a new PIN (the Manager sets or resets it)
export const pinSet = z.object({ pin })
