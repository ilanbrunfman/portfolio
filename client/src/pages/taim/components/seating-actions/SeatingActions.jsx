import { useEffect, useState } from 'react'
import { api } from '@/pages/taim/api/client'
import Input from '@/components/ui/form/input/Input'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Button from '@/components/ui/button/Button'
import './SeatingActions.scss'

/**
 * Fix a seating mistake: "Move or change guests" (table orders) and
 * "Undo seating" (only while nothing is ordered). Shown to anyone with the
 * seatTable right, on the Order screen and in the Floor's bill dialog.
 * The move form opens in place (not in another dialog, since this may
 * already sit inside one).
 *
 * @param {object} props
 * @param {object} props.order                    The open order.
 * @param {({ tableId?, guests? }) => Promise} props.onUpdate  Move / change guests.
 * @param {() => Promise} props.onUndo            Undo the seating (the order is deleted).
 */
const SeatingActions = ({ order, onUpdate, onUndo }) => {
    const [moving, setMoving] = useState(false)
    const [confirmUndo, setConfirmUndo] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const canUndo = order.items.length === 0

    const undo = async () => {
        setBusy(true)
        setError('')
        try {
            await onUndo()
        } catch (err) {
            setError(err.message)
            setBusy(false)
            setConfirmUndo(false)
        }
    }

    return (
        <div className="d-flex flex-column gap-0-5">
            <div className="d-flex flex-wrap gap-0-5">
                {order.type === 'TABLE' && !moving && (
                    <Button size="sm" variant="secondary" onClick={() => setMoving(true)} disabled={busy}>
                        Move or change guests
                    </Button>
                )}
                {canUndo &&
                    (confirmUndo ? (
                        <>
                            <Button size="sm" onClick={undo} disabled={busy}>
                                {busy ? 'Cancelling…' : order.type === 'TABLE' ? 'Yes, undo seating' : 'Yes, cancel take-out'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setConfirmUndo(false)} disabled={busy}>
                                {order.type === 'TABLE' ? 'Keep seating' : 'Keep it'}
                            </Button>
                        </>
                    ) : (
                        <Button size="sm" variant="ghost" onClick={() => setConfirmUndo(true)}>
                            {order.type === 'TABLE' ? 'Undo seating' : 'Cancel take-out'}
                        </Button>
                    ))}
            </div>
            {error && <p className="form__error" role="alert">{error}</p>}

            {moving && (
                <div className="seating-actions__move surface">
                    <MoveForm order={order} onSave={onUpdate} onDone={() => setMoving(false)} />
                </div>
            )}
        </div>
    )
}

/** Pick a ready, free table (or keep this one) and the guest count */
const MoveForm = ({ order, onSave, onDone }) => {
    const [tables, setTables] = useState(null)
    const [tableId, setTableId] = useState(String(order.table.id))
    const [guests, setGuests] = useState(String(order.guests))
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        let cancelled = false
        api('/tables')
            .then((list) => { if (!cancelled) setTables(list) })
            .catch((err) => { if (!cancelled) setErrors({ form: err.message }) })
        return () => { cancelled = true }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        const count = Number(guests)
        if (!Number.isInteger(count) || count < 1) return setErrors({ guests: 'Enter how many guests, e.g. 2' })
        const data = {}
        if (Number(tableId) !== order.table.id) data.tableId = Number(tableId)
        if (count !== order.guests) data.guests = count
        if (Object.keys(data).length === 0) return onDone()

        setSaving(true)
        try {
            await onSave(data)
            onDone()
        } catch (err) {
            const { _: general, ...fields } = err.fields ?? {}
            setErrors({ ...fields, form: Object.keys(fields).length ? general : (general ?? err.message) })
            setSaving(false)
        }
    }

    if (!tables) return errors.form ? <p className="form__error" role="alert">{errors.form}</p> : <p role="status">Loading tables…</p>

    // This table, plus every table that's free and clean
    const options = tables
        .filter((t) => t.id === order.table.id || (!t.order && !t.needsCleaning))
        .map((t) => ({ value: String(t.id), label: `${t.label} (${t.seats})` }))

    return (
        <form className="d-flex flex-column gap-1" onSubmit={handleSubmit} noValidate>
            {errors.form && <p className="form__error" role="alert">{errors.form}</p>}
            <RadioGroup label="Table (seats)" options={options} value={tableId} onChange={(v) => { setTableId(v); setErrors({}) }} direction="row" />
            {errors.tableId && <p className="form__error" role="alert">{errors.tableId}</p>}
            <Input
                label="Guests"
                value={guests}
                onChange={(e) => { setGuests(e.target.value); setErrors({}) }}
                error={errors.guests}
                type="number"
                inputMode="numeric"
                min={1}
                max={50}
            />
            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </div>
        </form>
    )
}

export default SeatingActions
