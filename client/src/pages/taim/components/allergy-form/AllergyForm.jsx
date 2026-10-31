import { useState } from 'react'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import Input from '@/components/ui/form/input/Input'
import Button from '@/components/ui/button/Button'
import { ALLERGENS } from '@/pages/taim/utils/allergens'

const WHOLE = 'whole'
const seatOf = (value) => (value === WHOLE ? null : Number(value))

/**
 * Note a guest's allergy on the bill (step 5.4): for which seat (or the
 * whole table; a take-out has one for the whole order), what they're
 * allergic to, and a note ("severe", "no traces"). Picking a seat shows
 * what's noted for it already; saving it empty removes it. Meant to sit
 * inside a <Modal>.
 *
 * @param {object} props
 * @param {object} props.order    { type, guests, allergies: [{ seat, allergens, note }] }
 * @param {number|null} [props.seat]  Seat to start on (null = whole table).
 * @param {({ seat, allergens, note }) => Promise} props.onSave  Throws on failure.
 * @param {() => void} props.onDone
 */
const AllergyForm = ({ order, seat: initialSeat = null, onSave, onDone }) => {
    const atTable = order.type === 'TABLE'
    const rowFor = (value) => order.allergies.find((row) => row.seat === seatOf(value))
    const [seat, setSeat] = useState(initialSeat === null ? WHOLE : String(initialSeat))
    const [allergens, setAllergens] = useState(rowFor(seat)?.allergens ?? [])
    const [note, setNote] = useState(rowFor(seat)?.note ?? '')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const existing = rowFor(seat)

    const pickSeat = (value) => {
        setSeat(value)
        setAllergens(rowFor(value)?.allergens ?? [])
        setNote(rowFor(value)?.note ?? '')
        setError('')
    }
    const toggle = (value) =>
        setAllergens((list) => (list.includes(value) ? list.filter((v) => v !== value) : ALLERGENS.map((a) => a.value).filter((v) => v === value || list.includes(v))))

    const save = async (body) => {
        setSaving(true)
        setError('')
        try {
            await onSave(body)
            onDone()
        } catch (err) {
            setError(err.fields?.seat ?? err.fields?.note ?? err.message)
            setSaving(false)
        }
    }
    const empty = allergens.length === 0 && !note.trim()

    return (
        <form
            className="d-flex flex-column gap-1"
            onSubmit={(e) => { e.preventDefault(); save({ seat: seatOf(seat), allergens, note: note.trim() || null }) }}
            noValidate
        >
            {atTable && (
                <RadioGroup
                    label="Who"
                    options={[{ value: WHOLE, label: 'Whole table' }, ...Array.from({ length: order.guests }, (_, i) => ({ value: String(i + 1), label: `Seat ${i + 1}` }))]}
                    value={seat}
                    onChange={pickSeat}
                    direction="row"
                />
            )}
            <fieldset className="d-flex flex-column gap-0-5">
                <legend className="form__label">Allergic to</legend>
                <div className="d-flex flex-wrap gap-1">
                    {ALLERGENS.map((allergen) => (
                        <Checkbox key={allergen.value} label={allergen.label} checked={allergens.includes(allergen.value)} onChange={() => toggle(allergen.value)} />
                    ))}
                </div>
            </fieldset>
            <Input
                label="Note (optional)"
                hint="How serious, or anything else: the kitchen sees it on the ticket."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                placeholder="e.g. severe · no traces at all · no pork"
            />
            {error && <p className="form__error" role="alert">{error}</p>}
            <div className="d-flex flex-wrap justify-end gap-0-5">
                {existing && (
                    <Button variant="secondary" className="mr-auto" onClick={() => save({ seat: seatOf(seat), allergens: [], note: null })} disabled={saving}>
                        Remove
                    </Button>
                )}
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving || empty}>{saving ? 'Saving…' : 'Save allergy'}</Button>
            </div>
        </form>
    )
}

export default AllergyForm
