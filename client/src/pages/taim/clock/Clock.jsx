import { useEffect, useMemo, useState } from 'react'
import { useClock } from '@/pages/taim/hooks/useClock'
import { useTimesheet } from '@/pages/taim/hooks/useTimesheet'
import { useTeamTimesheet } from '@/pages/taim/hooks/useTeamTimesheet'
import LiveTimer from '@/pages/taim/components/live-timer/LiveTimer'
import { useStaff } from '@/pages/taim/context/StaffContext'
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
 * While you're clocked in, a live timer counts how long you've been on
 * the clock (its digits roll); on a break a second one counts the break.
 * The Manager and Host start on "Everyone": each person's hours in the
 * period, and the team total; a tap opens that person's timesheet.
 */
const Clock = () => {
    const { session, can } = useStaff()
    const clock = useClock()
    const manages = can('manageTime')
    const [period, setPeriod] = useState('week')
    // 'all' = everyone's hours (Manager, Host); else a person's id
    const [personId, setPersonId] = useState(manages ? 'all' : String(session.staff.id))
    const [people, setPeople] = useState([])
    const range = useMemo(() => periodRange(period), [period])
    const everyone = personId === 'all'
    const sheet = useTimesheet(everyone ? session.staff.id : Number(personId), range)
    const team = useTeamTimesheet(range, manages && everyone)
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
            team.reload()
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
    const mine = !everyone && Number(personId) === session.staff.id

    return (
        <div className="clock d-flex flex-column gap-2">
            <h2 className="taim__heading">Clock</h2>

            <section className={`clock__status surface d-flex flex-wrap align-items-center justify-between gap-1 ${entry ? (onBreak ? 'is-break' : 'is-on') : 'is-off'}`} aria-label="Your clock">
                <span className="d-flex flex-column gap-0-5">
                    <strong className="clock__state">
                        {!entry ? 'Not clocked in' : onBreak ? `On a break since ${clockTime(runningBreak.startAt)}` : `On the clock since ${clockTime(entry.clockIn)}`}
                    </strong>
                    {/* How long you've been on the clock, live; and the break, while on one */}
                    {entry && <LiveTimer since={entry.clockIn} label="On the clock" />}
                    {entry && onBreak && (
                        <span className="clock__break d-flex align-items-baseline gap-0-5">
                            Break <LiveTimer since={runningBreak.startAt} size="sm" label="On a break" />
                        </span>
                    )}
                    <span className="form__hint">Worked today {duration(clock.data.todayMinutes)} (breaks not counted)</span>
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
                    <h3 id="sheet-title" className="clock__section-title">{everyone ? "Everyone's hours" : mine ? 'Your timesheet' : `${sheet.data?.staff.name ?? ''}'s timesheet`}</h3>
                    {!everyone && <Button size="sm" variant="ghost" icon="IconPlus" onClick={() => setEditing(null)}>Entry</Button>}
                </div>
                {manages && people.length > 0 && (
                    <RadioGroup
                        label="Whose"
                        options={[{ value: 'all', label: 'Everyone' }, ...people.map((p) => ({ value: String(p.id), label: p.id === session.staff.id ? `${p.name} (you)` : p.name }))]}
                        value={personId}
                        onChange={setPersonId}
                        direction="row"
                    />
                )}
                <Tabs label="Period" items={PERIODS} value={period} onChange={setPeriod}>
                    {() =>
                        everyone ? (
                            <TeamHours team={team} onPick={(id) => setPersonId(String(id))} />
                        ) : sheet.error && !sheet.data ? (
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

/** Everyone's hours in the period: one row per person (a tap opens their timesheet) and the team total */
const TeamHours = ({ team, onPick }) => {
    if (team.error && !team.data) return <p className="form__error" role="alert">{team.error}</p>
    if (!team.data) return <p role="status">Loading…</p>
    return (
        <div className="d-flex flex-column gap-1 clock__sheet">
            <p className="clock__totals">
                <strong>{duration(team.data.workedMinutes)}</strong> worked by the team
                <span className="form__hint">
                    {' '}· {duration(team.data.breakMinutes)} of breaks (unpaid){team.data.forgot > 0 && ` · ${team.data.forgot} forgot to clock out`}
                </span>
            </p>
            <ul className="clock__list surface">
                {team.data.people.map((row) => (
                    <li key={row.staff.id}>
                        <button type="button" className="clock__entry d-flex flex-wrap align-items-center justify-between gap-0-5" onClick={() => onPick(row.staff.id)} aria-label={`${row.staff.name}, ${duration(row.workedMinutes)} in ${row.days} days. Open the timesheet`}>
                            <span className="d-flex flex-column">
                                <span className="d-flex flex-wrap align-items-baseline gap-0-5">
                                    <strong className="clock__name">{row.staff.name}</strong>
                                    <span className="clock__role">{ROLE_LABELS[row.staff.role]}</span>
                                    {row.on && <span className="clock__tag is-on">On now</span>}
                                    {row.forgot > 0 && <span className="clock__tag is-forgot">{row.forgot} forgot</span>}
                                    {row.edited > 0 && <span className="clock__tag">{row.edited} edited</span>}
                                    {!row.staff.active && <span className="clock__tag">Left</span>}
                                </span>
                                <span className="form__hint">
                                    {row.days} {row.days === 1 ? 'day' : 'days'} · {row.entries} {row.entries === 1 ? 'entry' : 'entries'}
                                    {row.breakMinutes > 0 && ` · breaks ${duration(row.breakMinutes)}`}
                                </span>
                            </span>
                            <span className="clock__worked">{duration(row.workedMinutes)}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default Clock
