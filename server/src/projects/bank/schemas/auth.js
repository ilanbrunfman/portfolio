import { z } from 'zod'

// POST /api/auth/signup and /api/auth/login
export const credentials = z.object({
    email: z
        .string({ error: 'Email is required' })
        .trim()
        .toLowerCase()
        .pipe(z.email({ error: 'Enter a valid email' })),
    password: z
        .string({ error: 'Password is required' })
        .min(8, 'Use at least 8 characters')
        .max(200, 'Max 200 characters'),
})
