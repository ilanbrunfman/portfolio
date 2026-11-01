import { z } from 'zod'

// Step 8.2: the time clock

const time = (message) => z.coerce.date({ error: message })
const breakTimes = z.object({
    startAt: time('Break start must be a date and time'),
    endAt: time('Break end must be a date and time').nullable().default(null),
})
const reason = z.string({ error: 'Say why' }).trim().min(1, 'Say why').max(200, 'Max 200 characters')

// PATCH /api/taim/time-entries/:id – new times for an entry, and why
export const entryEdit = z.object({
    clockIn: time('Clock-in must be a date and time'),
    clockOut: time('Clock-out must be a date and time').nullable().default(null),
    breaks: z.array(breakTimes, { error: 'Breaks must be a list' }).max(10, 'Max 10 breaks').default([]),
    reason,
})

// POST /api/taim/time-entries – an entry added by hand (forgot to clock in)
export const entryAdd = z.object({
    staffId: z.number({ error: 'Pick a person' }).int('Pick a person').positive('Pick a person').optional(),
    clockIn: time('Clock-in must be a date and time'),
    clockOut: time('Clock-out must be a date and time'),
    breaks: z.array(breakTimes.extend({ endAt: time('Break end must be a date and time') }), { error: 'Breaks must be a list' }).max(10, 'Max 10 breaks').default([]),
    reason,
})

// GET /api/taim/timesheets?from=&to=&staffId=
export const timesheetQuery = z.object({
    from: time('From must be a date'),
    to: time('To must be a date'),
    staffId: z.coerce.number({ error: 'Invalid person' }).int('Invalid person').positive('Invalid person').optional(),
})
