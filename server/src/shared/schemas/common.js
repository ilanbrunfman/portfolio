import { z } from 'zod'

// /:id in the URL is a string – coerce it to a positive whole number
export const idParams = z.object({
    id: z.coerce.number({ error: 'Invalid id' }).int('Invalid id').positive('Invalid id'),
})

// Money is always whole cents (1250 = 12.50)
export const cents = z.number({ error: 'Must be a number' }).int('Use whole cents')
