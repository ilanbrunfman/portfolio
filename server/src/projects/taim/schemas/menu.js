import { z } from 'zod'
import { cents } from '../../../shared/schemas/common.js'

const nothingToUpdate = (data) => Object.keys(data).length > 0

// ---------- categories ----------

// POST /api/taim/categories – it goes to the end of the menu
export const categoryCreate = z.object({
    name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(40, 'Max 40 characters'),
})

// PATCH /api/taim/categories/:id – rename
export const categoryUpdate = categoryCreate.partial().refine(nothingToUpdate, 'Nothing to update')

// ---------- dishes ----------

const dishFields = {
    categoryId: z.number({ error: 'Pick a category' }).int('Pick a category').positive('Pick a category'),
    name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(60, 'Max 60 characters'),
    // Empty text is saved as "no description"
    description: z
        .string()
        .trim()
        .max(200, 'Max 200 characters')
        .nullable()
        .transform((text) => text || null),
    price: cents.positive('Price must be more than 0'),
    // How long the kitchen should take (minutes); null = not set
    prepMinutes: z
        .number({ error: 'Prep time must be a whole number of minutes' })
        .int('Prep time must be a whole number of minutes')
        .min(1, 'Prep time must be at least 1 minute')
        .max(180, 'Max 180 minutes')
        .nullable(),
    hidden: z.boolean({ error: 'Must be true or false' }),
}

// POST /api/taim/menu-items – category, name and price required
export const menuItemCreate = z.object({
    categoryId: dishFields.categoryId,
    name: dishFields.name,
    description: dishFields.description.optional(),
    price: dishFields.price,
    prepMinutes: dishFields.prepMinutes.default(null),
    hidden: dishFields.hidden.default(false),
})

// PATCH /api/taim/menu-items/:id – any subset (hidden: true = sold out)
export const menuItemUpdate = z.object(dishFields).partial().refine(nothingToUpdate, 'Nothing to update')

// PUT /api/taim/categories/:id/dish-order – the category's dish ids, top first
export const dishOrder = z.object({
    dishIds: z
        .array(z.number().int('Invalid dish id').positive('Invalid dish id'), { error: 'Send the dish ids in their new order' })
        .min(1, 'Send the dish ids in their new order')
        .refine((ids) => new Set(ids).size === ids.length, 'Each dish can appear only once'),
})
