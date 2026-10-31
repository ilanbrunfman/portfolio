import { useState } from 'react'
import Input from '@/components/ui/form/input/Input'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Button from '@/components/ui/button/Button'
import { ROLE_LABELS } from '@/pages/taim/data/screens'
import { centsToInput, parseMoney } from '@/pages/taim/utils/money'

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))

/**
 * Add a person to the roster, or change one (step 8.1, Manager): name,
 * role, phone, hourly rate, start date – and, for a new person, their
 * first 4-digit PIN. Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {object|null} props.person   A roster row to edit, or null to add someone.
 * @param {(body: object) => Promise} props.onSave  Throws with err.fields on failure.
 * @param {() => void} props.onDone
 */
const StaffForm = ({ person, onSave, onDone }) => {
    const [name, setName] = useState(person?.name ?? '')
    const [role, setRole] = useState(person?.role ?? 'WAITER')
    const [phone, setPhone] = useState(person?.phone ?? '')
    const [rate, setRate] = useState(person?.hourlyRate != null ? centsToInput(person.hourlyRate) : '')
    const [startDate, setStartDate] = useState(person?.startDate ?? '')
    const [pin, setPin] = useState('')
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    // Clear a field's error (and the general one) as soon as it's edited
    const clear = (field) =>
        setErrors((current) => {
            const next = { ...current }
            delete next[field]
            delete next.form
            return next
        })

    const submit = async (e) => {
        e.preventDefault()
        const found = {}
        if (!name.trim()) found.name = 'Name is required'
        const cents = rate.trim() === '' ? null : parseMoney(rate)
        if (rate.trim() !== '' && cents === null) found.hourlyRate = 'Enter a rate like 42 or 42.50'
        if (!person && !/^\d{4}$/.test(pin)) found.pin = 'The PIN is 4 digits'
        if (Object.keys(found).length > 0) return setErrors(found)

        setSaving(true)
        try {
            await onSave({
                name: name.trim(),
                role,
                phone: phone.trim() || null,
                hourlyRate: cents,
                startDate: startDate || null,
                ...(!person && { pin }),
            })
            onDone()
        } catch (err) {
            const { _: general, ...fields } = err.fields ?? {}
            setErrors({ ...fields, form: Object.keys(fields).length ? general : (general ?? err.message) })
            setSaving(false)
        }
    }

    return (
        <form className="d-flex flex-column gap-1" onSubmit={submit} noValidate>
            {errors.form && <p className="form__error" role="alert">{errors.form}</p>}
            <Input label="Name" value={name} onChange={(e) => { setName(e.target.value); clear('name') }} error={errors.name} maxLength={40} autoComplete="off" />
            <RadioGroup label="Role" options={ROLE_OPTIONS} value={role} onChange={(value) => { setRole(value); clear('role') }} direction="row" />
            {errors.role && <p className="form__error" role="alert">{errors.role}</p>}
            <Input label="Phone (optional)" type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); clear('phone') }} error={errors.phone} maxLength={20} placeholder="050-123-4567" />
            <div className="d-flex flex-wrap gap-1">
                <Input
                    label="Hourly rate (optional)"
                    hint="Only the Manager sees it."
                    value={rate}
                    onChange={(e) => { setRate(e.target.value); clear('hourlyRate') }}
                    error={errors.hourlyRate}
                    inputMode="decimal"
                    placeholder="42.00"
                />
                <Input label="Start date (optional)" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); clear('startDate') }} error={errors.startDate} />
            </div>
            {!person && (
                <Input
                    label="PIN"
                    hint="4 digits, their own: they type it on “Who are you?”. Tell them in person."
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); clear('pin') }}
                    error={errors.pin}
                />
            )}
            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : person ? 'Save' : 'Add person'}</Button>
            </div>
        </form>
    )
}

export default StaffForm
