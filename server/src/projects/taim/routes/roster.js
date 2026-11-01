import { Router } from 'express'
import { prisma } from '../../../shared/db.js'
import { validate } from '../../../shared/middleware/validate.js'
import { HttpError } from '../../../shared/lib/httpError.js'
import { idParams } from '../../../shared/schemas/common.js'
import { allow } from '../middleware/staff.js'
import { ROLES } from '../roles.js'
import { rosterCreate, rosterUpdate, pinSet } from '../schemas/roster.js'
import { endSessionsOf, hashPin, requireFreePin } from '../services/sessions.js'

// Step 8.1: the roster – who works here, their role, phone, hourly rate and
// start date, and their PIN. The Manager keeps it (manageStaff): rates are
// pay information. People who leave are made inactive, never deleted (bills
// and shifts point at them).
const router = Router()

const ROSTER_SELECT = { id: true, name: true, role: true, phone: true, hourlyRate: true, startDate: true, active: true, pinHash: true, demoPin: true, lockedUntil: true, createdAt: true }

/** A roster row for the API: never the PIN's hash, only whether there is one */
const toRosterJson = ({ pinHash, demoPin, startDate, ...person }) => ({
    ...person,
    startDate: startDate ? startDate.toISOString().slice(0, 10) : null,
    hasPin: Boolean(pinHash),
    demoPin: demoPin !== null, // a demo PIN still in use (the Manager may want to change it)
})

/** Who's working here, Manager first; then the people who left */
const byRole = (a, b) => Number(b.active) - Number(a.active) || ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || a.name.localeCompare(b.name)

/** There must always be an active Manager: refuses a change that would leave none */
async function keepAManager(id, change) {
    const person = await prisma.staff.findUnique({ where: { id }, select: { role: true, active: true } })
    if (!person) throw new HttpError(404, 'Staff member not found')
    const losesManager = person.role === 'MANAGER' && person.active && ((change.role && change.role !== 'MANAGER') || change.active === false)
    if (!losesManager) return
    const others = await prisma.staff.count({ where: { role: 'MANAGER', active: true, id: { not: id } } })
    if (others === 0) throw new HttpError(409, 'Ta\'im needs at least one active Manager')
}

// GET /api/taim/roster – everyone, working here first
router.get('/roster', allow('manageStaff'), async (req, res) => {
    const people = await prisma.staff.findMany({ select: ROSTER_SELECT })
    res.json(people.sort(byRole).map(toRosterJson))
})

// POST /api/taim/roster { name, role, phone?, hourlyRate?, startDate?, pin }
router.post('/roster', allow('manageStaff'), validate({ body: rosterCreate }), async (req, res) => {
    const { pin, ...data } = req.valid.body
    await requireFreePin(pin)
    const person = await prisma.staff.create({ data: { ...data, pinHash: await hashPin(pin) }, select: ROSTER_SELECT })
    res.status(201).json(toRosterJson(person))
})

// PATCH /api/taim/roster/:id { name?, role?, phone?, hourlyRate?, startDate?, active? }
// active: false = they left: logged out everywhere, gone from "Who are you?".
// You can't make yourself inactive; there's always an active Manager.
// Coming back (active: true again): they need a new PIN.
router.patch('/roster/:id', allow('manageStaff'), validate({ params: idParams, body: rosterUpdate }), async (req, res) => {
    const { id } = req.valid.params
    const data = req.valid.body
    if (id === req.staff.id && data.active === false) throw new HttpError(409, "You can't mark yourself as left")
    await keepAManager(id, data)
    // Back at work: their old PIN may be someone else's by now, and can't be
    // checked without knowing it – so it's cleared and the Manager sets a new one
    if (data.active === true) {
        const before = await prisma.staff.findUnique({ where: { id }, select: { active: true } })
        if (before && !before.active) Object.assign(data, { pinHash: null, demoPin: null, failedPins: 0, lockedUntil: null })
    }
    const person = await prisma.staff.update({ where: { id }, data, select: ROSTER_SELECT })
    if (data.active === false) await endSessionsOf(id)
    res.json(toRosterJson(person))
})

// PUT /api/taim/roster/:id/pin { pin } – set or reset someone's PIN. Their
// other sessions end; a demo PIN is gone for good; a lock is lifted.
router.put('/roster/:id/pin', allow('manageStaff'), validate({ params: idParams, body: pinSet }), async (req, res) => {
    const { id } = req.valid.params
    const person = await prisma.staff.findUnique({ where: { id }, select: { active: true } })
    if (!person) throw new HttpError(404, 'Staff member not found')
    if (!person.active) throw new HttpError(409, 'They left: make them active first')
    await requireFreePin(req.valid.body.pin, id)
    await prisma.staff.update({ where: { id }, data: { pinHash: await hashPin(req.valid.body.pin), demoPin: null, failedPins: 0, lockedUntil: null } })
    await endSessionsOf(id, id === req.staff.id ? req.sessionToken : null)
    res.status(204).end()
})

export default router
