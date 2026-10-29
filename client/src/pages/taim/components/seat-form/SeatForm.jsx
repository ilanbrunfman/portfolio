import { useState } from 'react'
import Input from '@/components/ui/form/input/Input'
import Button from '@/components/ui/button/Button'

/**
 * Seat a table (how many guests?) or start a take-out (whose name, and
 * optionally a phone number to call when it's ready?).
 * Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {object|null} props.table          The free table to seat, or null for a take-out.
 * @param {(value: number|{ customerName, customerPhone }) => Promise} props.onSave  Guests (table) or name + phone (take-out); throws on failure.
 * @param {() => Promise} [props.onNeedsCleaning]  Table only: "Not clean? Needs cleaning" sends it back to yellow.
 * @param {() => Promise} [props.onSplit]          Combined tables only: "Split tables" back into single ones.
 * @param {() => void} props.onDone          Called after saving, and on Cancel.
 */
const SeatForm = ({ table, onSave, onNeedsCleaning, onSplit, onDone }) => {
    const isTable = Boolean(table)
    const [value, setValue] = useState(isTable ? String(Math.min(2, table.seats)) : '')
    const [phone, setPhone] = useState('')
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const field = isTable ? 'guests' : 'customerName'

    const handleSubmit = async (e) => {
        e.preventDefault()
        let data
        if (isTable) {
            data = Number(value.trim())
            if (!Number.isInteger(data) || data < 1) return setErrors({ [field]: 'Enter how many guests, e.g. 2' })
            // No more guests than seats (combined tables: their total); the server checks too
            if (data > table.seats) return setErrors({ [field]: `${table.label} has ${table.seats} seats: seat up to ${table.seats} guests` })
        } else {
            data = { customerName: value.trim(), customerPhone: phone.trim() }
            if (!data.customerName) return setErrors({ customerName: 'Name is required' })
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

    // "Needs cleaning" / "Split tables": do it, then close
    const runAndClose = async (action) => {
        setSaving(true)
        try {
            await action()
            onDone()
        } catch (err) {
            setErrors({ form: err.message })
            setSaving(false)
        }
    }

    return (
        <form className="d-flex flex-column gap-1" onSubmit={handleSubmit} noValidate>
            {errors.form && <p className="form__error" role="alert">{errors.form}</p>}

            {isTable ? (
                <Input
                    label="Guests"
                    hint={`Up to ${table.seats} guests (${table.label} has ${table.seats} seats).`}
                    value={value}
                    onChange={(e) => { setValue(e.target.value); setErrors({}) }}
                    error={errors.guests}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={table.seats}
                    autoFocus
                />
            ) : (
                <>
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
                    <Input
                        label="Phone (optional)"
                        hint="To call when the order is ready."
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setErrors({}) }}
                        error={errors.customerPhone}
                        type="tel"
                        inputMode="tel"
                        autoComplete="off"
                        maxLength={20}
                        placeholder="e.g. 050-123-4567"
                    />
                </>
            )}

            <div className="d-flex flex-wrap justify-end gap-0-5">
                {isTable && (onNeedsCleaning || onSplit) && (
                    <div className="d-flex flex-wrap gap-0-5 mr-auto">
                        {onSplit && (
                            <Button variant="ghost" onClick={() => runAndClose(onSplit)} disabled={saving}>Split tables</Button>
                        )}
                        {onNeedsCleaning && (
                            <Button variant="ghost" onClick={() => runAndClose(onNeedsCleaning)} disabled={saving}>
                                Not clean? Needs cleaning
                            </Button>
                        )}
                    </div>
                )}
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : isTable ? `Seat ${table.label}` : 'Start take-out'}
                </Button>
            </div>
        </form>
    )
}

export default SeatForm
