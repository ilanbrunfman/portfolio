import { useState } from 'react'
import Input from '@/components/ui/form/input/Input'
import Button from '@/components/ui/button/Button'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'

const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter']

/**
 * A menu version's name, season and note: to start a draft, or to change
 * them later. Season: one of the four, or none.
 *
 * @param {object} props
 * @param {object|null} [props.version]               { name, season, note } to change, or null for a new draft.
 * @param {(data: { name, season, note }) => Promise} props.onSave  Throws with err.fields on failure.
 * @param {() => void} [props.onDone]                 Called after saving, and on Cancel (none = no Cancel).
 * @param {string} [props.submitLabel]
 */
const VersionForm = ({ version = null, onSave, onDone, submitLabel = 'Save' }) => {
    const [name, setName] = useState(version?.name ?? '')
    const [season, setSeason] = useState(version?.season ?? '')
    const [note, setNote] = useState(version?.note ?? '')
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) return setErrors({ name: 'Name is required' })
        setSaving(true)
        try {
            await onSave({ name: name.trim(), season: season || null, note: note.trim() || null })
            setSaving(false)
            onDone?.()
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
                label="Name"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors({}) }}
                error={errors.name}
                maxLength={60}
                autoComplete="off"
                placeholder="e.g. Winter menu"
            />
            <RadioGroup
                label="Season"
                options={[{ value: '', label: 'None' }, ...SEASONS.map((s) => ({ value: s, label: s }))]}
                value={season}
                onChange={setSeason}
                direction="row"
            />
            <Input
                label="Note (optional)"
                hint="What this menu is about, for the team."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                error={errors.note}
                maxLength={200}
                autoComplete="off"
                placeholder="e.g. Soup season"
            />
            <div className="d-flex flex-wrap justify-end gap-0-5">
                {onDone && <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>}
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : submitLabel}</Button>
            </div>
        </form>
    )
}

export default VersionForm
