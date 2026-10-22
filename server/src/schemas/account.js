import { z } from 'zod'
import { cents } from './common.js'

export const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'CREDIT', 'CASH']

// Each field once; create and update reuse them
const fields = {
    name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(60, 'Max 60 characters'),
    type: z.enum(ACCOUNT_TYPES, { error: `Type must be one of ${ACCOUNT_TYPES.join(', ')}` }),
    openingBalance: cents,
    color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Use a hex color like #aa3bff').nullable(),
}

// POST /api/accounts – name required, the rest has defaults
export const accountCreate = z.object({
    name: fields.name,
    type: fields.type.default('CHECKING'),
    openingBalance: fields.openingBalance.default(0),
    color: fields.color.optional(),
})

// PATCH /api/accounts/:id – any subset of fields (no defaults, so missing
// fields are left unchanged), plus archived
export const accountUpdate = z
    .object({ ...fields, archived: z.boolean({ error: 'Must be true or false' }) })
    .partial()
    .refine((data) => Object.keys(data).length > 0, 'Nothing to update')

// GET /api/accounts?includeArchived=true
export const accountListQuery = z.object({
    includeArchived: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
})
