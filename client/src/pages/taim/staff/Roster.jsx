import { useState } from 'react'
import { useRoster } from '@/pages/taim/hooks/useRoster'
import { useStaff } from '@/pages/taim/context/StaffContext'
import StaffForm from '@/pages/taim/components/staff-form/StaffForm'
import Accordion from '@/components/ui/accordion/Accordion'
import Modal from '@/components/ui/modal/Modal'
import Button from '@/components/ui/button/Button'
import Input from '@/components/ui/form/input/Input'
import { ROLE_LABELS } from '@/pages/taim/data/screens'
import { formatMoney } from '@/pages/taim/utils/money'
import { clockTime } from '@/pages/taim/utils/orders'
import './Roster.scss'

/** "2024-03-01" → "Mar 1, 2024" */
const dateLabel = (text) => new Date(`${text}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * /taim/staff – the roster (step 8.1, Manager only): the people working
 * here, each with role, phone, hourly rate, start date and PIN state (a
 * demo PIN still in use, locked after wrong PINs, no PIN yet), Edit and Set
 * PIN; "Add person"; and, folded, the people who left, with "Bring back"
 * (they need a new PIN). Rates are pay information: only the Manager sees
 * this screen.
 */
const Roster = () => {
    const roster = useRoster()
    const { session } = useStaff()
    const [editing, setEditing] = useState(null) // { kind: 'person' | 'pin', person? }
    const [error, setError] = useState('')
    const close = () => setEditing(null)

    if (roster.error && !roster.people) {
        return (
            <div className="taim__notice surface d-flex flex-column gap-1 align-items-start" role="alert">
                <p>Couldn't load the staff: {roster.error}</p>
                <Button variant="secondary" onClick={roster.reload}>Try again</Button>
            </div>
        )
    }
    if (!roster.people) return <p role="status">Loading the staff…</p>

    const working = roster.people.filter((p) => p.active)
    const left = roster.people.filter((p) => !p.active)
    const run = async (action) => {
        setError('')
        try {
            await action()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="roster d-flex flex-column gap-1">
            <div className="d-flex flex-wrap align-items-center justify-between gap-1">
                <div className="d-flex flex-column">
                    <h2 className="taim__heading">Staff</h2>
                    <span className="form__hint">{working.length} working here{left.length > 0 && ` · ${left.length} left`}</span>
                </div>
                <Button icon="IconPlus" onClick={() => setEditing({ kind: 'person', person: null })}>Person</Button>
            </div>

            {error && <p className="form__error" role="alert">{error}</p>}

            <ul className="roster__list surface">
                {working.map((person) => (
                    <li key={person.id}>
                        <PersonRow person={person} isMe={person.id === session.staff.id}>
                            <Button size="sm" variant="ghost" onClick={() => setEditing({ kind: 'pin', person })}>Set PIN</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditing({ kind: 'person', person })}>Edit</Button>
                        </PersonRow>
                    </li>
                ))}
            </ul>

            {left.length > 0 && (
                <Accordion className="roster__left surface">
                    <Accordion.Item title={`Left (${left.length})`}>
                        <ul className="roster__list">
                            {left.map((person) => (
                                <li key={person.id}>
                                    <PersonRow person={person}>
                                        <Button size="sm" variant="secondary" onClick={() => run(() => roster.update(person.id, { active: true }))}>Bring back</Button>
                                    </PersonRow>
                                </li>
                            ))}
                        </ul>
                    </Accordion.Item>
                </Accordion>
            )}

            <Modal isOpen={editing?.kind === 'person'} onClose={close} title={editing?.person ? `Edit ${editing.person.name}` : 'Add person'}>
                {editing?.kind === 'person' && (
                    <>
                        <StaffForm
                            person={editing.person}
                            onSave={(body) => (editing.person ? roster.update(editing.person.id, body) : roster.add(body))}
                            onDone={close}
                        />
                        {editing.person && editing.person.id !== session.staff.id && (
                            <LeaveButton person={editing.person} onLeave={async () => { await roster.update(editing.person.id, { active: false }); close() }} />
                        )}
                    </>
                )}
            </Modal>

            <Modal isOpen={editing?.kind === 'pin'} onClose={close} title={editing ? `PIN for ${editing.person?.name}` : ''} size="sm">
                {editing?.kind === 'pin' && <PinForm person={editing.person} onSave={(pin) => roster.setPin(editing.person.id, pin)} onDone={close} />}
            </Modal>
        </div>
    )
}

/** One person: name and role, phone, rate, since when, PIN state; the buttons on the right */
const PersonRow = ({ person, isMe = false, children }) => {
    const locked = person.lockedUntil && new Date(person.lockedUntil) > new Date()
    return (
        <div className={`roster__row d-flex flex-wrap align-items-center justify-between gap-1 ${person.active ? '' : 'is-left'}`}>
            <span className="d-flex flex-column">
                <span className="d-flex flex-wrap align-items-baseline gap-0-5">
                    <strong className="roster__name">{person.name}</strong>
                    <span className="roster__role">{ROLE_LABELS[person.role]}</span>
                    {isMe && <span className="roster__tag">You</span>}
                    {person.active && !person.hasPin && <span className="roster__tag is-alert">No PIN</span>}
                    {person.active && person.demoPin && <span className="roster__tag is-warn">Demo PIN</span>}
                    {locked && <span className="roster__tag is-alert">Locked until {clockTime(person.lockedUntil)}</span>}
                </span>
                <span className="form__hint">
                    {[
                        person.phone,
                        person.hourlyRate != null ? `${formatMoney(person.hourlyRate)}/h` : 'no rate',
                        person.startDate && `since ${dateLabel(person.startDate)}`,
                    ].filter(Boolean).join(' · ')}
                </span>
            </span>
            <span className="d-flex flex-wrap gap-0-5">{children}</span>
        </div>
    )
}

/** Set or reset a PIN: 4 digits, typed twice */
const PinForm = ({ person, onSave, onDone }) => {
    const [pin, setPin] = useState('')
    const [again, setAgain] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const digits = (value) => value.replace(/\D/g, '').slice(0, 4)

    const submit = async (e) => {
        e.preventDefault()
        if (!/^\d{4}$/.test(pin)) return setError('The PIN is 4 digits')
        if (pin !== again) return setError("The two PINs aren't the same")
        setSaving(true)
        try {
            await onSave(pin)
            onDone()
        } catch (err) {
            setError(err.fields?.pin ?? err.message)
            setSaving(false)
        }
    }

    return (
        <form className="d-flex flex-column gap-1" onSubmit={submit} noValidate>
            <p className="form__hint">
                {person.name} types it on “Who are you?”. Their other sessions end{person.demoPin ? ', and the demo PIN stops working' : ''}.
            </p>
            <Input label="New PIN" type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} value={pin} onChange={(e) => { setPin(digits(e.target.value)); setError('') }} />
            <Input label="Once more" type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} value={again} onChange={(e) => { setAgain(digits(e.target.value)); setError('') }} />
            {error && <p className="form__error" role="alert">{error}</p>}
            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Set PIN'}</Button>
            </div>
        </form>
    )
}

/** "Left the restaurant": asks once; they're logged out and off "Who are you?" */
const LeaveButton = ({ person, onLeave }) => {
    const [confirming, setConfirming] = useState(false)
    const [error, setError] = useState('')
    const leave = async () => {
        try {
            await onLeave()
        } catch (err) {
            setError(err.message)
            setConfirming(false)
        }
    }
    return (
        <div className="roster__leave d-flex flex-column gap-0-5">
            {error && <p className="form__error" role="alert">{error}</p>}
            {confirming ? (
                <span className="d-flex flex-wrap align-items-center gap-0-5">
                    <span className="form__hint mr-auto">{person.name} is logged out and leaves “Who are you?”. Their bills stay.</span>
                    <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Keep</Button>
                    <Button size="sm" variant="secondary" onClick={leave}>Yes, {person.name} left</Button>
                </span>
            ) : (
                <Button size="sm" variant="ghost" icon="IconSignOut" onClick={() => setConfirming(true)}>{person.name} left the restaurant</Button>
            )}
        </div>
    )
}

export default Roster
