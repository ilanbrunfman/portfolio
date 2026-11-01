import { useEffect, useState } from 'react'
import Input from '@/components/ui/form/input/Input'
import Button from '@/components/ui/button/Button'
import { atTime, dateInput, duration, timeInput } from '@/pages/taim/utils/time'
import { clockTime } from '@/pages/taim/utils/orders'
import './TimeEntryForm.scss'

const MINUTE = 60_000
const minutesBetween = (a, b) => Math.max(0, Math.round((b - a) / MINUTE))

/**
 * Fix a time entry, or add one you forgot (step 8.2): the date, start and
 * end (an end earlier than the start is the next morning), the breaks
 * (unpaid), and the total worked, counted as you type. A reason is always
 * asked: every change is logged, and the entry's history shows below.
 * An entry still running may keep its end (and last break's end) empty.
 * Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {object|null} props.entry   From the timesheet, or null to add one.
 * @param {(body: { clockIn, clockOut, breaks, reason }) => Promise} props.onSave  Throws with err.fields.
 * @param {(id: number) => Promise<object[]>} [props.loadHistory]  The entry's edits.
 * @param {() => void} props.onDone
 */
const TimeEntryForm = ({ entry, onSave, loadHistory, onDone }) => {
    const running = Boolean(entry?.open)
    const [date, setDate] = useState(dateInput(entry?.clockIn ?? new Date()))
    const [start, setStart] = useState(entry ? timeInput(entry.clockIn) : '')
    const [end, setEnd] = useState(entry?.clockOut ? timeInput(entry.clockOut) : '')
    const [breaks, setBreaks] = useState(entry?.breaks.map((b) => ({ start: timeInput(b.startAt), end: b.endAt ? timeInput(b.endAt) : '' })) ?? [])
    const [reason, setReason] = useState('')
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [history, setHistory] = useState(null)

    useEffect(() => {
        if (!entry || !loadHistory) return
        let cancelled = false
        loadHistory(entry.id).then((rows) => { if (!cancelled) setHistory(rows) }).catch(() => {})
        return () => { cancelled = true }
    }, [entry, loadHistory])

    // The times as instants (a time before the start = the next day)
    const clockIn = start ? atTime(date, start) : null
    const clockOut = clockIn && end ? atTime(date, end, clockIn) : null
    const breakTimes = clockIn
        ? breaks
              .filter((b) => b.start && b.end !== b.start) // a break of no time is nothing to keep
              .map((b) => {
                  const startAt = atTime(date, b.start, new Date(clockIn.getTime() - MINUTE))
                  return { startAt, endAt: b.end ? atTime(date, b.end, startAt) : null }
              })
        : []
    const now = new Date()
    const breakMinutes = breakTimes.reduce((sum, b) => sum + minutesBetween(b.startAt, b.endAt ?? now), 0)
    const total = clockIn ? Math.max(0, minutesBetween(clockIn, clockOut ?? now) - breakMinutes) : 0

    const setBreak = (i, field, value) => setBreaks((list) => list.map((b, j) => (j === i ? { ...b, [field]: value } : b)))

    const submit = async (e) => {
        e.preventDefault()
        const found = {}
        if (!start) found.clockIn = 'When did it start?'
        if (!end && !running) found.clockOut = 'When did it end?'
        if (!reason.trim()) found.reason = 'Say why'
        if (Object.keys(found).length) return setErrors(found)
        setSaving(true)
        try {
            await onSave({
                clockIn: clockIn.toISOString(),
                clockOut: clockOut ? clockOut.toISOString() : null,
                breaks: breakTimes.map((b) => ({ startAt: b.startAt.toISOString(), endAt: b.endAt ? b.endAt.toISOString() : null })),
                reason: reason.trim(),
            })
            onDone()
        } catch (err) {
            const { _: general, ...fields } = err.fields ?? {}
            setErrors({ ...fields, form: Object.keys(fields).length ? general : (general ?? err.message) })
            setSaving(false)
        }
    }

    return (
        <form className="time-entry-form d-flex flex-column gap-1" onSubmit={submit} noValidate>
            {errors.form && <p className="form__error" role="alert">{errors.form}</p>}
            {entry?.forgot && <p className="time-entry-form__forgot">Closed at the end of the day: nobody clocked out. Set the real end time.</p>}
            <div className="d-flex flex-wrap gap-1">
                <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Input label="Start" type="time" value={start} onChange={(e) => { setStart(e.target.value); setErrors({}) }} error={errors.clockIn} />
                <Input
                    label={running ? 'End (empty = still working)' : 'End'}
                    type="time"
                    value={end}
                    onChange={(e) => { setEnd(e.target.value); setErrors({}) }}
                    error={errors.clockOut}
                    hint={clockIn && clockOut && dateInput(clockOut) !== date ? 'The next day' : undefined}
                />
            </div>

            <fieldset className="time-entry-form__group d-flex flex-column gap-0-5">
                <legend className="form__label">Breaks (unpaid)</legend>
                {breaks.length === 0 && <p className="form__hint">No breaks.</p>}
                {breaks.map((b, i) => (
                    <div key={i} className="time-entry-form__break d-flex flex-wrap align-items-end gap-0-5">
                        <Input label="From" type="time" value={b.start} onChange={(e) => setBreak(i, 'start', e.target.value)} />
                        <Input label="To" type="time" value={b.end} onChange={(e) => setBreak(i, 'end', e.target.value)} />
                        <Button size="sm" variant="ghost" icon="IconTrash" onClick={() => setBreaks((list) => list.filter((_, j) => j !== i))} aria-label={`Remove break ${i + 1}`} />
                    </div>
                ))}
                {errors.breaks && <p className="form__error" role="alert">{errors.breaks}</p>}
                <div>
                    <Button size="sm" variant="ghost" icon="IconPlus" onClick={() => setBreaks((list) => [...list, { start: '', end: '' }])}>Break</Button>
                </div>
            </fieldset>

            <p className="time-entry-form__total">
                Total worked <strong>{duration(total)}</strong>
                {breakMinutes > 0 && <span className="form__hint"> · {duration(breakMinutes)} of breaks</span>}
            </p>

            <Input
                label="Why the change?"
                value={reason}
                onChange={(e) => { setReason(e.target.value); setErrors((current) => ({ ...current, reason: undefined, form: undefined })) }}
                error={errors.reason}
                maxLength={200}
                placeholder={entry ? 'e.g. forgot to clock out at 23:00' : 'e.g. forgot to clock in'}
                hint="Every change is kept, with your name."
            />

            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : entry ? 'Save' : 'Add entry'}</Button>
            </div>

            {history?.length > 0 && (
                <section className="time-entry-form__history" aria-label="Changes">
                    <h3 className="form__label">Changes</h3>
                    <ul>
                        {history.map((edit) => (
                            <li key={edit.id}>
                                <strong>{edit.editedBy.name}</strong> · {new Date(edit.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} {clockTime(edit.createdAt)} · “{edit.reason}”
                                <span className="form__hint">
                                    {edit.before
                                        ? ` · was ${clockTime(edit.before.clockIn)}–${edit.before.clockOut ? clockTime(edit.before.clockOut) : '…'}, now ${clockTime(edit.after.clockIn)}–${edit.after.clockOut ? clockTime(edit.after.clockOut) : '…'}`
                                        : ' · added by hand'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </form>
    )
}

export default TimeEntryForm
