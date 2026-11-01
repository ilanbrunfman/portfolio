import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { idParams } from '../../../shared/schemas/common.js'
import { ROLES, permissionsFor } from '../roles.js'
import { entryAdd, entryEdit, teamQuery, timesheetQuery } from '../schemas/clock.js'
import { ENTRY_SELECT, addEntry, canManage, clockIn, clockOut, editEntry, endBreak, openEntry, startBreak, toEntryJson, workedMinutes } from '../services/timeClock.js'

// Step 8.2: the time clock – everyone's Clock tab. Clock in / out and
// breaks are always your own. Timesheets and fixes: your own, or anyone's
// with manageTime (Manager, Host). Every fix needs a reason and is logged.
const router = Router()

const rightsOf = (staff) => permissionsFor(staff.role).rights
const startOfToday = (now) => new Date(now.getFullYear(), now.getMonth(), now.getDate())

/** Your clock: the open entry (or null) and today's worked minutes */
async function myClock(staffId, now = new Date()) {
    const [entry, today] = await Promise.all([
        openEntry(staffId),
        prisma.timeEntry.findMany({ where: { staffId, OR: [{ clockOut: null }, { clockOut: { gte: startOfToday(now) } }] }, select: ENTRY_SELECT }),
    ])
    return { entry: entry && toEntryJson(entry, now), todayMinutes: today.reduce((sum, e) => sum + workedMinutes(e, now), 0) }
}

// GET /api/taim/clock – your clock; with manageTime also who's on now
router.get('/clock', async (req, res) => {
    const now = new Date()
    const me = await myClock(req.staff.id, now)
    let onNow
    if (rightsOf(req.staff).includes('manageTime')) {
        const open = await prisma.timeEntry.findMany({ where: { clockOut: null }, select: ENTRY_SELECT, orderBy: { clockIn: 'asc' } })
        onNow = open.map((entry) => toEntryJson(entry, now))
    }
    res.json({ ...me, ...(onNow && { onNow }) })
})

// POST /api/taim/clock/in · /out · /break-start · /break-end → your clock
const action = (fn) => async (req, res) => {
    await fn(req.staff.id)
    res.json(await myClock(req.staff.id))
}
router.post('/clock/in', action(clockIn))
router.post('/clock/out', action(clockOut))
router.post('/clock/break-start', action(startBreak))
router.post('/clock/break-end', action(endBreak))

// GET /api/taim/timesheets?from=&to=&staffId= – entries that started in
// [from, to), newest first, with worked / break minutes and totals. Your
// own, or anyone's with manageTime (403 otherwise).
router.get('/timesheets', validate({ query: timesheetQuery }), async (req, res) => {
    const { from, to, staffId = req.staff.id } = req.valid.query
    if (!canManage(req.staff, staffId, rightsOf(req.staff))) throw new HttpError(403, "You can only see your own timesheet")
    const person = await prisma.staff.findUnique({ where: { id: staffId }, select: { id: true, name: true, role: true } })
    if (!person) throw new HttpError(404, 'Staff member not found')
    const now = new Date()
    const entries = (await prisma.timeEntry.findMany({ where: { staffId, clockIn: { gte: from, lt: to } }, select: ENTRY_SELECT, orderBy: { clockIn: 'desc' } })).map((e) => toEntryJson(e, now))
    res.json({
        staff: person,
        entries,
        workedMinutes: entries.reduce((sum, e) => sum + e.workedMinutes, 0),
        breakMinutes: entries.reduce((sum, e) => sum + e.breakMinutes, 0),
        forgot: entries.filter((e) => e.forgot).length,
    })
})

// GET /api/taim/timesheets/team?from=&to= (manageTime: Manager, Host) –
// everyone's hours in the period: one row per person working here (and
// anyone who left but has entries in it), Manager first, plus the totals
router.get('/timesheets/team', validate({ query: teamQuery }), async (req, res) => {
    if (!rightsOf(req.staff).includes('manageTime')) throw new HttpError(403, "You can only see your own timesheet")
    const { from, to } = req.valid.query
    const now = new Date()
    const [people, entries] = await Promise.all([
        prisma.staff.findMany({ select: { id: true, name: true, role: true, active: true } }),
        prisma.timeEntry.findMany({ where: { clockIn: { gte: from, lt: to } }, select: ENTRY_SELECT }),
    ])
    const rows = people
        .map((person) => {
            const mine = entries.filter((e) => e.staffId === person.id).map((e) => toEntryJson(e, now))
            return {
                staff: { id: person.id, name: person.name, role: person.role, active: person.active },
                workedMinutes: mine.reduce((sum, e) => sum + e.workedMinutes, 0),
                breakMinutes: mine.reduce((sum, e) => sum + e.breakMinutes, 0),
                entries: mine.length,
                // days with at least one entry
                days: new Set(mine.map((e) => new Date(e.clockIn).toDateString())).size,
                forgot: mine.filter((e) => e.forgot).length,
                edited: mine.filter((e) => e.edited).length,
                on: mine.some((e) => e.open),
            }
        })
        .filter((row) => row.staff.active || row.entries > 0)
        .sort((a, b) => ROLES.indexOf(a.staff.role) - ROLES.indexOf(b.staff.role) || a.staff.name.localeCompare(b.staff.name))
    res.json({
        people: rows,
        workedMinutes: rows.reduce((sum, r) => sum + r.workedMinutes, 0),
        breakMinutes: rows.reduce((sum, r) => sum + r.breakMinutes, 0),
        forgot: rows.reduce((sum, r) => sum + r.forgot, 0),
    })
})

/** The entry, if you may change it (404 / 403) */
async function requireEntry(req, id) {
    const entry = await prisma.timeEntry.findUnique({ where: { id }, select: { staffId: true } })
    if (!entry) throw new HttpError(404, 'Time entry not found')
    if (!canManage(req.staff, entry.staffId, rightsOf(req.staff))) throw new HttpError(403, 'You can only change your own entries')
    return entry
}

// PATCH /api/taim/time-entries/:id { clockIn, clockOut, breaks, reason }
router.patch('/time-entries/:id', validate({ params: idParams, body: entryEdit }), async (req, res) => {
    const { id } = req.valid.params
    await requireEntry(req, id)
    const entry = await editEntry({ id, ...req.valid.body, editorId: req.staff.id })
    res.json(toEntryJson(entry))
})

// POST /api/taim/time-entries { staffId?, clockIn, clockOut, breaks, reason }
router.post('/time-entries', validate({ body: entryAdd }), async (req, res) => {
    const { staffId = req.staff.id, ...body } = req.valid.body
    if (!canManage(req.staff, staffId, rightsOf(req.staff))) throw new HttpError(403, 'You can only add your own entries')
    const entry = await addEntry({ staffId, ...body, editorId: req.staff.id })
    res.status(201).json(toEntryJson(entry))
})

// GET /api/taim/time-entries/:id/edits – who changed it, why, before / after
router.get('/time-entries/:id/edits', validate({ params: idParams }), async (req, res) => {
    await requireEntry(req, req.valid.params.id)
    const edits = await prisma.timeEdit.findMany({
        where: { entryId: req.valid.params.id },
        select: { id: true, reason: true, before: true, after: true, createdAt: true, editedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
    })
    res.json(edits)
})

export default router
