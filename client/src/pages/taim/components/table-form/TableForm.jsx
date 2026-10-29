import { useState } from 'react'
import Input from '@/components/ui/form/input/Input'
import Button from '@/components/ui/button/Button'

/**
 * Add a table to the floor (Manager). Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {string} [props.suggestedLabel]   Prefilled label, e.g. "T9".
 * @param {({ label, seats }) => Promise} props.onSave  Throws with err.fields on failure.
 * @param {() => void} props.onDone         Called after saving, and on Cancel.
 */
const TableForm = ({ suggestedLabel = '', onSave, onDone }) => {
    const [label, setLabel] = useState(suggestedLabel)
    const [seats, setSeats] = useState('4')
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        const count = Number(seats)
        const found = {}
        if (!label.trim()) found.label = 'Label is required'
        if (!Number.isInteger(count) || count < 1) found.seats = 'Enter how many seats, e.g. 4'
        if (Object.keys(found).length > 0) return setErrors(found)

        setSaving(true)
        try {
            await onSave({ label: label.trim(), seats: count })
            onDone()
        } catch (err) {
            const { _: general, ...fields } = err.fields ?? {}
            setErrors({ ...fields, form: Object.keys(fields).length ? general : (general ?? err.message) })
            setSaving(false)
        }
    }

    return (
        <form className="d-flex flex-column gap-1" onSubmit={handleSubmit} noValidate>
            {errors.form && <p className="form__error" role="alert">{errors.form}</p>}
            <Input
                label="Label"
                value={label}
                onChange={(e) => { setLabel(e.target.value); setErrors({}) }}
                error={errors.label}
                maxLength={10}
                autoComplete="off"
                placeholder="e.g. T9"
            />
            <Input
                label="Seats"
                value={seats}
                onChange={(e) => { setSeats(e.target.value); setErrors({}) }}
                error={errors.seats}
                type="number"
                inputMode="numeric"
                min={1}
                max={30}
            />
            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add table'}</Button>
            </div>
        </form>
    )
}

export default TableForm
