// Menu versions (step 3.1): labels and dates for the Versions screens

const DAY = 86_400_000

/** "Sat 10 Oct" (with the year when it isn't this year) */
export function dayLabel(date) {
    const d = new Date(date)
    const year = d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year })
}

/** "Sun 9 Nov, 11:00" */
export const dayTimeLabel = (date) => `${dayLabel(date)}, ${new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}`

const daysLabel = (days) => `${days} ${days === 1 ? 'day' : 'days'}`

/**
 * When a version was (or will be) the menu in use:
 *   "In use since Sat 10 Oct · 21 days" · "Sat 5 Sep – Sat 10 Oct · 35 days" ·
 *   "Starts Sun 9 Nov, 11:00" · "Draft, started Thu 29 Oct"
 */
export function periodLabel(version) {
    if (version.status === 'DRAFT') return `Draft, started ${dayLabel(version.createdAt)}`
    if (version.status === 'SCHEDULED') return `Starts ${dayTimeLabel(version.activeFrom)}`
    const days = version.stats?.days ?? Math.max(1, Math.round(((version.activeTo ? new Date(version.activeTo) : new Date()) - new Date(version.activeFrom)) / DAY))
    if (version.status === 'ACTIVE') return `In use since ${dayLabel(version.activeFrom)} · ${daysLabel(days)}`
    return `${dayLabel(version.activeFrom)} – ${dayLabel(version.activeTo)} · ${daysLabel(days)}`
}

/**
 * The tags on a version's card: Current, Draft, Scheduled, Best income
 * (most income per day), Last (the menu before the one in use)
 * @returns {{ label: string, tone: string }[]}
 */
export function versionTags(version, { bestId, lastId }) {
    const tags = []
    if (version.status === 'ACTIVE') tags.push({ label: 'Current', tone: 'current' })
    if (version.status === 'DRAFT') tags.push({ label: 'Draft', tone: 'draft' })
    if (version.status === 'SCHEDULED') tags.push({ label: 'Scheduled', tone: 'draft' })
    if (version.id === bestId) tags.push({ label: 'Best income', tone: 'best' })
    if (version.id === lastId) tags.push({ label: 'Last', tone: 'plain' })
    return tags
}

/** A Date → "2026-11-09T11:00" for <input type="datetime-local"> (local time) */
export function toLocalInput(date) {
    const d = new Date(date)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
