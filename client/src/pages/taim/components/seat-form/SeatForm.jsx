import { useState } from 'react'
import Input from '@/components/ui/form/input/Input'
import Button from '@/components/ui/button/Button'

/**
 * Seat a table (how many guests?) or start a take-out (whose name?).
 * Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {object|null} props.table          The free table to seat, or null for a take-out.
 * @param {(value: number|string) => Promise} props.onSave  Guests (table) or name (take-out); throws on failure.
 * @param {() => void} props.onDone          Called after saving, and on Cancel.
 */
const SeatForm = ({ table, onSave, onDone }) => {
    const isTable = Boolean(table)
    const [value, setValue] = useState(isTable ? String(Math.min(2, table.seats)) : '')
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const field = isTable ? 'guests' : 'customerName'

    const handleSubmit = async (e) => {
        e.preventDefault()
        let data = value.trim()
        if (isTable) {
            data = Number(data)
            if (!Number.isInteger(data) || data < 1) return setErrors({ [field]: 'Enter how many guests, e.g. 2' })
        } else if (!data) {
            return setErrors({ [field]: 'Name is required' })
        }

        setSaving(true)
        try {
            await onSave(data)
            onDone()
        } catch (err) {
            // Server validation → under the input; anything else (e.g. "This table
            // is already seated") on top
            const { _: general, ...fields } = err.fields ?? {}
            setErrors({ ...fields, form: Object.keys(fields).length ? general : (general ?? err.message) })
            setSaving(false)
        }
    }

    return (
        <form className="d-flex flex-column gap-1" onSubmit={handleSubmit} noValidate>
            {errors.form && <p className="form__error" role="alert">{errors.form}</p>}

            {isTable ? (
                <Input
                    label="Guests"
                    hint={`${table.label} has ${table.seats} seats.`}
                    value={value}
                    onChange={(e) => { setValue(e.target.value); setErrors({}) }}
                    error={errors.guests}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={50}
                    autoFocus
                />
            ) : (
                <Input
                    label="Name for the order"
                    value={value}
                    onChange={(e) => { setValue(e.target.value); setErrors({}) }}
                    error={errors.customerName}
                    maxLength={40}
                    autoComplete="off"
                    placeholder="e.g. Maya"
                    autoFocus
                />
            )}

            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : isTable ? `Seat ${table.label}` : 'Start take-out'}
                </Button>
            </div>
        </form>
    )
}

export default SeatForm
