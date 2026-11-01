import { useEffect, useMemo, useState } from 'react'
import { useClock } from '@/pages/taim/hooks/useClock'
import { useTimesheet } from '@/pages/taim/hooks/useTimesheet'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { useNow, minutesSince } from '@/pages/taim/hooks/useNow'
import { api } from '@/pages/taim/api/client'
import TimeEntryForm from '@/pages/taim/components/time-entry-form/TimeEntryForm'
import Tabs from '@/components/ui/tabs/Tabs'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Modal from '@/components/ui/modal/Modal'
import Button from '@/components/ui/button/Button'
import { ROLE_LABELS } from '@/pages/taim/data/screens'
import { clockTime } from '@/pages/taim/utils/orders'
import { dayLabel, duration, periodRange } from '@/pages/taim/utils/time'
import './Clock.scss'

const PERIODS = [
    { id: 'week', label: 'This week' },
    { id: 'last-week', label: 'Last week' },
    { id: 'month', label: 'This month' },
]

/**
 * /taim/clock – everyone's time clock (step 8.2): clock in, take a break
 * (unpaid), clock out; today's worked time; your timesheet for this week,
 * last week or this month, where a tap on an entry opens it to fix (date,
 * start, end, breaks; a reason is asked and logged) and "Entry" adds one
 * you forgot. The Manager and Host also see who's on now and anyone's
 * timesheet (and fix anyone's entries).
 */
const Clock = () => {
    const { session, can } = useStaff()
    const clock = useClock()
    const now = useNow(30_000)
    const manages = can('manageTime')
    const [period, setPeriod] = useState('week')
    const [personId, setPersonId] = useState(String(session.staff.id))
    const [people, setPeople] = useState([])
    const range = useMemo(() => periodRange(period), [period])
    const sheet = useTimesheet(Number(personId), range)
    const [editing, setEditing] = useState(undefined) // an entry, null = adding one, undefined = closed
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!manages) return
        api('/staff').then(setPeople).catch(() => {})
    }, [manages])

    const act = async (step) => {
        setBusy(true)
        setError('')
        try {
            await clock.act(step)
            sheet.reload()
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    if (clock.error && !clock.data) return <p className="form__error" role="alert">Couldn't load the clock: {clock.error}</p>
    if (!clock.data) return <p role="status">Loading the clock…</p>

    const { entry } = clock.data
    const onBreak = entry?.onBreak
    const runningBreak = entry?.breaks.find((b) => !b.endAt)
    const mine = Number(personId) === session.staff.id

    return (
        <div className="clock d-flex flex-column gap-2">
            <h2 className="taim__heading">Clock</h2>

            <section className={`clock__status surface d-flex flex-wrap align-items-center justify-between gap-1 ${entry ? (onBreak ? 'is-break' : 'is-on') : 'is-off'}`} aria-label="Your clock">
                <span className="d-flex flex-column">
                    <strong className="clock__state">
                        {!entry ? 'Not clocked in' : onBreak ? `On a break since ${clockTime(runningBreak.startAt)}` : `Clocked in since ${clockTime(entry.clockIn)}`}
                    </strong>
                    <span className="form__hint">
                        Today {duration(clock.data.todayMinutes)}
                        {entry && onBreak && ` · break ${minutesSince(runningBreak.startAt, now)} min`}
                    </span>
                    {error && <span className="form__error" role="alert">{error}</span>}
                </span>
                <span className="d-flex flex-wrap gap-0-5">
                    {!entry && <Button onClick={() => act('in')} disabled={busy}>Clock in</Button>}
                    {entry && !onBreak && <Button variant="secondary" onClick={() => act('break-start')} disabled={busy}>Start break</Button>}
                    {entry && onBreak && <Button onClick={() => act('break-end')} disabled={busy}>End break</Button>}
                    {entry && <Button variant={onBreak ? 'secondary' : 'primary'} onClick={() => act('out')} disabled={busy}>Clock out</Button>}
                </span>
            </section>

            {clock.data.onNow && (
                <section className="d-flex flex-column gap-1" aria-labelledby="on-now-title">
                    <h3 id="on-now-title" className="clock__section-title">Who's on now ({clock.data.onNow.length})</h3>
                    {clock.data.onNow.length === 0 ? (
                        <p className="form__hint">Nobody is clocked in.</p>
                    ) : (
                        <ul className="clock__list surface">
                            {clock.data.onNow.map((e) => (
                                <li key={e.id} className="clock__row d-flex flex-wrap align-items-center justify-between gap-0-5">
                                    <span className="d-flex flex-wrap align-items-baseline gap-0-5">
                                        <strong className="clock__name">{e.staff.name}</strong>
                                        <span className="clock__role">{ROLE_LABELS[e.staff.role]}</span>
                                        {e.onBreak && <span className="clock__tag is-break">On break</span>}
                                    </span>
                                    <span className="form__hint">since {clockTime(e.clockIn)} · {duration(e.workedMinutes)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <section className="d-flex flex-column gap-1" aria-labelledby="sheet-title">
                <div className="d-flex flex-wrap align-items-center justify-between gap-1">
                    <h3 id="sheet-title" className="clock__section-title">{mine ? 'Your timesheet' : `${sheet.data?.staff.name ?? ''}'s timesheet`}</h3>
                    <Button size="sm" variant="ghost" icon="IconPlus" onClick={() => setEditing(null)}>Entry</Button>
                </div>
                {manages && people.length > 0 && (
                    <RadioGroup
                        label="Whose"
                        options={people.map((p) => ({ value: String(p.id), label: p.id === session.staff.id ? `${p.name} (you)` : p.name }))}
                        value={personId}
                        onChange={setPersonId}
                        direction="row"
                    />
                )}
                <Tabs label="Period" items={PERIODS} value={period} onChange={setPeriod}>
                    {() =>
                        sheet.error && !sheet.data ? (
                            <p className="form__error" role="alert">{sheet.error}</p>
                        ) : !sheet.data ? (
                            <p role="status">Loading…</p>
                        ) : (
                            <div className="d-flex flex-column gap-1 clock__sheet">
                                <p className="clock__totals">
                                    <strong>{duration(sheet.data.workedMinutes)}</strong> worked
                                    <span className="form__hint">
                                        {' '}· {sheet.data.entries.length} {sheet.data.entries.length === 1 ? 'entry' : 'entries'} · {duration(sheet.data.breakMinutes)} of breaks (unpaid)
                                        {sheet.data.forgot > 0 && ` · ${sheet.data.forgot} forgot to clock out`}
                                    </span>
                                </p>
                                {sheet.data.entries.length === 0 ? (
                                    <p className="form__hint">No entries in this period.</p>
                                ) : (
                                    <ul className="clock__list surface">
                                        {sheet.data.entries.map((e) => (
                                            <li key={e.id}>
                                                <button type="button" className="clock__entry d-flex flex-wrap align-items-center justify-between gap-0-5" onClick={() => setEditing(e)} aria-label={`${dayLabel(e.clockIn)}, ${clockTime(e.clockIn)} to ${e.clockOut ? clockTime(e.clockOut) : 'now'}, ${duration(e.workedMinutes)}. Edit`}>
                                                    <span className="d-flex flex-column">
                                                        <span className="d-flex flex-wrap align-items-baseline gap-0-5">
                                                            <strong className="clock__name">{dayLabel(e.clockIn)}</strong>
                                                            {e.open && <span className="clock__tag is-on">Running</span>}
                                                            {e.forgot && <span className="clock__tag is-forgot">Forgot to clock out</span>}
                                                            {e.edited && <span className="clock__tag">Edited</span>}
                                                        </span>
                                                        <span className="form__hint">
                                                            {clockTime(e.clockIn)} – {e.clockOut ? clockTime(e.clockOut) : 'now'}
                                                            {e.breakMinutes > 0 && ` · breaks ${duration(e.breakMinutes)}`}
                                                        </span>
                                                    </span>
                                                    <span className="clock__worked">{duration(e.workedMinutes)}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )
                    }
                </Tabs>
            </section>

            <Modal isOpen={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? `${editing.staff.name} · ${dayLabel(editing.clockIn)}` : 'Add an entry'}>
                {editing !== undefined && (
                    <TimeEntryForm
                        entry={editing}
                        onSave={async (body) => {
                            if (editing) await sheet.edit(editing.id, body)
                            else await sheet.add({ ...body, ...(!mine && { staffId: Number(personId) }) })
                            clock.reload()
                        }}
                        loadHistory={sheet.history}
                        onDone={() => setEditing(undefined)}
                    />
                )}
            </Modal>
        </div>
    )
}

export default Clock
