import { useState } from 'react'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Input from '@/components/ui/form/input/Input'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import { RETURN_REASONS } from '@/pages/taim/utils/orders'
import './CameBackForm.scss'

const NEXT = [
    { value: 'remake', label: 'Make it again (free)' },
    { value: 'none', label: 'Nothing more' },
]

/**
 * A guest gave a served dish back: why (one tap, plus an optional note) and
 * what now – make it again (on the house, straight to the kitchen) or
 * nothing more (if they want something else, add it from the menu as
 * usual). The returned dish leaves the bill either way. Meant to sit inside
 * the bill item editor.
 *
 * @param {object} props
 * @param {object} props.item   The served dish ({ name, price }).
 * @param {({ reason: string, note: string|null, remake: boolean }) => Promise} props.onSubmit  Throws on failure.
 * @param {() => void} props.onCancel
 */
const CameBackForm = ({ item, onSubmit, onCancel }) => {
    const [reason, setReason] = useState('')
    const [note, setNote] = useState('')
    const [next, setNext] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const submit = async (e) => {
        e.preventDefault()
        setBusy(true)
        setError('')
        try {
            await onSubmit({ reason, note: note.trim() || null, remake: next === 'remake' })
        } catch (err) {
            setError(err.fields?.note ?? err.message)
            setBusy(false)
        }
    }

    const lost = next === 'remake' ? item.price * 2 : item.price

    return (
        <form className="came-back-form d-flex flex-column gap-1" onSubmit={submit} noValidate>
            <RadioGroup label="Why did it come back?" options={RETURN_REASONS} value={reason} onChange={setReason} direction="row" className="came-back-form__reasons" />
            <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="e.g. lukewarm in the middle" />
            <RadioGroup label="What now?" options={NEXT} value={next} onChange={setNext} direction="row" />
            {next && (
                <p className="form__hint">
                    {item.name} comes off the bill
                    {next === 'remake' ? ', and a new one goes to the kitchen now, on the house' : '. Something else? Add it from the menu'}.
                    {' '}Loss: {formatMoney(lost)}.
                </p>
            )}
            {error && <p className="form__error" role="alert">{error}</p>}
            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onCancel} disabled={busy}>Back</Button>
                <Button type="submit" disabled={busy || !reason || !next}>
                    {busy ? 'Saving…' : next === 'remake' ? 'Came back · make it again' : 'Came back'}
                </Button>
            </div>
        </form>
    )
}

export default CameBackForm
