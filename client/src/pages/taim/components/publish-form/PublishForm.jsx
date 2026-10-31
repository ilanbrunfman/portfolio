import { useState } from 'react'
import Input from '@/components/ui/form/input/Input'
import Button from '@/components/ui/button/Button'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import VersionChanges from '@/pages/taim/components/version-changes/VersionChanges'
import { toLocalInput, dayTimeLabel } from '@/pages/taim/utils/versions'

/** Tomorrow at 11:00, before opening: the usual start for a new menu */
function tomorrowMorning() {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(11, 0, 0, 0)
    return d
}

/**
 * Publish the draft (Manager or Chef): now, or from a date and time (the menu
 * switches by itself then). Shows what will change first. Meant to sit
 * inside a <Modal>.
 *
 * @param {object} props
 * @param {object} props.draft                    The draft ({ name, changes }).
 * @param {(startsAt: Date|null) => Promise} props.onPublish  null = now.
 * @param {() => void} props.onDone               After publishing, and on Cancel.
 */
const PublishForm = ({ draft, onPublish, onDone }) => {
    const [when, setWhen] = useState('now')
    const [startsAt, setStartsAt] = useState(toLocalInput(tomorrowMorning()))
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        const date = when === 'later' ? new Date(startsAt) : null
        if (date && (Number.isNaN(date.getTime()) || date <= new Date())) return setError('Pick a time from now on')
        setSaving(true)
        setError('')
        try {
            await onPublish(date)
            onDone()
        } catch (err) {
            setError(err.message)
            setSaving(false)
        }
    }

    return (
        <form className="d-flex flex-column gap-1" onSubmit={handleSubmit} noValidate>
            <p>
                <strong>{draft.name}</strong> becomes the menu in use. Bills keep the dishes they were ordered from.
            </p>
            <VersionChanges changes={draft.changes ?? []} empty="No dish changes from the menu in use." />
            <RadioGroup
                label="When"
                options={[{ value: 'now', label: 'Now' }, { value: 'later', label: 'From a date' }]}
                value={when}
                onChange={(value) => { setWhen(value); setError('') }}
                direction="row"
            />
            {when === 'later' && (
                <Input
                    label="Starts"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => { setStartsAt(e.target.value); setError('') }}
                    min={toLocalInput(new Date())}
                    hint={startsAt ? `Until then it's scheduled: the menu in use stays. ${dayTimeLabel(new Date(startsAt))}.` : undefined}
                />
            )}
            {error && <p className="form__error" role="alert">{error}</p>}
            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Publishing…' : when === 'now' ? 'Publish now' : 'Schedule'}</Button>
            </div>
        </form>
    )
}

export default PublishForm
