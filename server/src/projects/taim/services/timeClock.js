import { prisma } from '../../../shared/db.js'
import { HttpError } from '../../../shared/lib/httpError.js'

// Step 8.2: the time clock. Everyone clocks in and out (and takes breaks,
// unpaid) on the Clock tab. Everyone fixes their own entries; the Manager
// and Host fix anyone's. Every fix keeps who, before / after, and why (if given).

const MINUTE = 60_000

export const ENTRY_SELECT = {
    id: true,
    staffId: true,
    clockIn: true,
    clockOut: true,
    forgot: true,
    edited: true,
    staff: { select: { id: true, name: true, role: true } },
    breaks: { select: { id: true, startAt: true, endAt: true }, orderBy: { startAt: 'asc' } },
}

/** Minutes between two times (a running one counts to now) */
const span = (from, to, now) => Math.max(0, Math.round(((to ?? now) - from) / MINUTE))

/** Worked minutes: clocked time minus breaks (unpaid) */
export function workedMinutes(entry, now = new Date()) {
    const breaks = entry.breaks.reduce((sum, b) => sum + span(b.startAt, b.endAt, now), 0)
    return Math.max(0, span(entry.clockIn, entry.clockOut, now) - breaks)
}

/** An entry for the API, with its worked and break minutes and whether it's running */
export function toEntryJson(entry, now = new Date()) {
    const breakMinutes = entry.breaks.reduce((sum, b) => sum + span(b.startAt, b.endAt, now), 0)
    return {
        ...entry,
        open: entry.clockOut === null,
        onBreak: entry.breaks.some((b) => b.endAt === null),
        breakMinutes,
        workedMinutes: workedMinutes(entry, now),
    }
}

/** May `staff` change this person's entries? Their own, or anyone's with manageTime */
export const canManage = (staff, staffId, rights) => staff.id === staffId || rights.includes('manageTime')

/** The person's open entry (clocked in), or null */
export const openEntry = (staffId, db = prisma) => db.timeEntry.findFirst({ where: { staffId, clockOut: null }, select: ENTRY_SELECT })

/** The database refused it: one open entry per person, or two entries overlap */
function overlapError(err) {
    const text = String(err.message)
    if (err.code === 'P2002' || text.includes('time_entries_one_open')) throw new HttpError(409, "You're already clocked in")
    if (text.includes('time_entries_no_overlap')) throw new HttpError(409, 'These times overlap another entry of the same person')
    if (text.includes('time_breaks_no_overlap')) throw new HttpError(409, 'Two breaks overlap')
    throw err
}

export async function clockIn(staffId, now = new Date()) {
    return prisma.timeEntry.create({ data: { staffId, clockIn: now }, select: ENTRY_SELECT }).catch(overlapError)
}

/** Clock out: an open break ends too */
export async function clockOut(staffId, now = new Date()) {
    return prisma.$transaction(async (tx) => {
        const entry = await openEntry(staffId, tx)
        if (!entry) throw new HttpError(409, "You're not clocked in")
        await tx.timeBreak.updateMany({ where: { entryId: entry.id, endAt: null }, data: { endAt: now } })
        return tx.timeEntry.update({ where: { id: entry.id }, data: { clockOut: now }, select: ENTRY_SELECT })
    })
}

export async function startBreak(staffId, now = new Date()) {
    const entry = await openEntry(staffId)
    if (!entry) throw new HttpError(409, 'Clock in first')
    if (entry.breaks.some((b) => b.endAt === null)) throw new HttpError(409, "You're on a break already")
    await prisma.timeBreak.create({ data: { entryId: entry.id, startAt: now } })
    return openEntry(staffId)
}

export async function endBreak(staffId, now = new Date()) {
    const entry = await openEntry(staffId)
    const running = entry?.breaks.find((b) => b.endAt === null)
    if (!running) throw new HttpError(409, "You're not on a break")
    await prisma.timeBreak.update({ where: { id: running.id }, data: { endAt: now } })
    return openEntry(staffId)
}

/**
 * The end of the day (04:00) came and someone never clocked out: their
 * entry closes then, flagged "forgot", for them (or the Manager / Host) to
 * fix. Entries clocked in after that moment stay open. Returns how many.
 */
export async function closeForgotten(dayEnd) {
    const open = await prisma.timeEntry.findMany({ where: { clockOut: null, clockIn: { lt: dayEnd } }, select: { id: true } })
    for (const { id } of open) {
        await prisma.$transaction([
            prisma.timeBreak.updateMany({ where: { entryId: id, endAt: null }, data: { endAt: dayEnd } }),
            prisma.timeEntry.update({ where: { id }, data: { clockOut: dayEnd, forgot: true } }),
        ])
    }
    return open.length
}

/** The times of an entry as the edit log keeps them */
const snapshot = (entry) => ({
    clockIn: entry.clockIn,
    clockOut: entry.clockOut,
    breaks: entry.breaks.map((b) => ({ startAt: b.startAt, endAt: b.endAt })),
})

/**
 * Check an entry's times: clock-out after clock-in and not in the future,
 * breaks inside the entry, in order and not overlapping. 400 under the
 * field otherwise. `open` = the entry is still running (no clock-out yet).
 */
function checkTimes({ clockIn, clockOut, breaks }, now) {
    const fail = (field, message) => {
        throw new HttpError(400, 'Validation failed', { fields: { [field]: message } })
    }
    if (clockIn > now) fail('clockIn', "Clock-in can't be in the future")
    if (clockOut && clockOut <= clockIn) fail('clockOut', 'Clock-out must be after clock-in')
    if (clockOut && clockOut > now) fail('clockOut', "Clock-out can't be in the future")
    const sorted = [...breaks].sort((a, b) => a.startAt - b.startAt)
    sorted.forEach((b, i) => {
        if (b.startAt < clockIn || (clockOut && b.startAt >= clockOut)) fail('breaks', 'A break must be inside the clocked time')
        if (b.endAt && b.endAt <= b.startAt) fail('breaks', 'A break must end after it starts')
        if (b.endAt && clockOut && b.endAt > clockOut) fail('breaks', 'A break must be inside the clocked time')
        if (!b.endAt && (clockOut || i < sorted.length - 1)) fail('breaks', 'Only the last break of a running entry can be open')
        if (i > 0 && (!sorted[i - 1].endAt || sorted[i - 1].endAt > b.startAt)) fail('breaks', 'Two breaks overlap')
    })
    return sorted
}

/**
 * Change an entry's times and breaks by hand, with an optional reason:
 * logged (who, before / after, why) and marked edited. Setting a clock-out clears the
 * "forgot" flag. Rights are checked by the route.
 */
export async function editEntry({ id, clockIn, clockOut, breaks, reason, editorId, now = new Date() }) {
    return prisma
        .$transaction(async (tx) => {
            const entry = await tx.timeEntry.findUnique({ where: { id }, select: ENTRY_SELECT })
            if (!entry) throw new HttpError(404, 'Time entry not found')
            // An entry that's over stays over: it can't be reopened by an edit
            if (entry.clockOut && !clockOut) throw new HttpError(400, 'Validation failed', { fields: { clockOut: 'Clock-out is required' } })
            const sorted = checkTimes({ clockIn, clockOut, breaks }, now)
            await tx.timeBreak.deleteMany({ where: { entryId: id } })
            if (sorted.length) await tx.timeBreak.createMany({ data: sorted.map((b) => ({ entryId: id, startAt: b.startAt, endAt: b.endAt })) })
            const updated = await tx.timeEntry.update({
                where: { id },
                data: { clockIn, clockOut, edited: true, forgot: clockOut ? false : entry.forgot },
                select: ENTRY_SELECT,
            })
            await tx.timeEdit.create({ data: { entryId: id, editedById: editorId, reason, before: snapshot(entry), after: snapshot(updated) } })
            return updated
        })
        .catch(overlapError)
}

/** Add an entry by hand (forgot to clock in at all), with an optional reason: logged */
export async function addEntry({ staffId, clockIn, clockOut, breaks, reason, editorId, now = new Date() }) {
    const sorted = checkTimes({ clockIn, clockOut, breaks }, now)
    return prisma
        .$transaction(async (tx) => {
            const entry = await tx.timeEntry.create({
                data: { staffId, clockIn, clockOut, edited: true, breaks: { create: sorted.map((b) => ({ startAt: b.startAt, endAt: b.endAt })) } },
                select: ENTRY_SELECT,
            })
            await tx.timeEdit.create({ data: { entryId: entry.id, editedById: editorId, reason, before: null, after: snapshot(entry) } })
            return entry
        })
        .catch(overlapError)
}
