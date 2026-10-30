import { useState } from 'react'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import Input from '@/components/ui/form/input/Input'
import Tabs from '@/components/ui/tabs/Tabs'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import { RETURN_REASONS } from '@/pages/taim/utils/orders'
import './CameBackForm.scss'

const NEXT = [
    { value: 'fix', label: 'Fix it (same plate)' },
    { value: 'remake', label: 'Make it again (free)' },
    { value: 'another', label: 'Another dish instead (free)' },
    { value: 'none', label: 'Nothing more' },
]

/**
 * A guest sent a served dish back: why (one tap, plus an optional note) and
 * what now:
 *   Fix it                 the same plate back to the kitchen (cook it more,
 *                          more spice); still on the bill, no loss
 * or they give it back and get, on the house:
 *   Make it again          the same dish
 *   Another dish instead   the right dish, something else, or a dessert on us
 *                          (picked from the menu below)
 *   Nothing more           just take it off (anything ordered after that is
 *                          added from the menu and charged as usual)
 * "Send to the kitchen now" (on by default) – untick it for a dessert that
 * should come later: it waits on the bill as not sent, free.
 * The returned dish leaves the bill either way. Meant to sit inside the bill
 * item editor.
 *
 * @param {object} props
 * @param {object} props.item   The served dish ({ name, price }).
 * @param {object[]} props.menu Menu categories with their dishes, for "another dish".
 * @param {({ reason, note, remake, replaceWithId, sendNow }) => Promise} props.onSubmit  Throws on failure.
 * @param {() => void} props.onCancel
 */
const CameBackForm = ({ item, menu, onSubmit, onCancel }) => {
    const [reason, setReason] = useState('')
    const [note, setNote] = useState('')
    const [next, setNext] = useState('')
    const [another, setAnother] = useState(null) // the dish picked for "another dish"
    const [sendNow, setSendNow] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const categories = menu.filter((category) => category.items.length > 0)
    const given = next === 'remake' ? item : next === 'another' ? another : null
    const ready = reason && next && (next !== 'another' || another)

    const submit = async (e) => {
        e.preventDefault()
        setBusy(true)
        setError('')
        try {
            await onSubmit({
                reason,
                note: note.trim() || null,
                fix: next === 'fix',
                remake: next === 'remake',
                replaceWithId: next === 'another' ? another.id : null,
                sendNow,
            })
        } catch (err) {
            setError(err.fields?.note ?? err.message)
            setBusy(false)
        }
    }

    return (
        <form className="came-back-form d-flex flex-column gap-1" onSubmit={submit} noValidate>
            <RadioGroup label="Why did it come back?" options={RETURN_REASONS} value={reason} onChange={setReason} direction="row" className="came-back-form__reasons" />
            <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="e.g. medium, not rare · more salt · lukewarm" />
            <RadioGroup label="What now?" options={NEXT} value={next} onChange={(value) => { setNext(value); setSendNow(true) }} direction="row" />

            {next === 'another' && (
                <div className="came-back-form__picker d-flex flex-column gap-0-5">
                    <Tabs label="Menu categories" items={categories.map((c) => ({ id: String(c.id), label: c.name }))}>
                        {(id) => (
                            <ul className="came-back-form__dishes">
                                {categories
                                    .find((c) => String(c.id) === id)
                                    ?.items.map((dish) => (
                                        <li key={dish.id}>
                                            <button
                                                type="button"
                                                className={`came-back-form__dish ${another?.id === dish.id ? 'is-picked' : ''}`}
                                                onClick={() => setAnother(dish)}
                                                disabled={dish.hidden}
                                                aria-pressed={another?.id === dish.id}
                                            >
                                                <span>{dish.name}</span>
                                                <span className="came-back-form__dish-price">{dish.hidden ? 'Sold out' : formatMoney(dish.price)}</span>
                                            </button>
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </Tabs>
                </div>
            )}

            {given && (
                <Checkbox
                    label="Send to the kitchen now (untick for later, e.g. a dessert)"
                    checked={sendNow}
                    onChange={(e) => setSendNow(e.target.checked)}
                />
            )}

            {next === 'fix' && (
                <p className="form__hint">
                    {item.name} goes back to the kitchen to be fixed{note.trim() ? ` ("${note.trim()}")` : ''} and stays on the bill. No loss.
                </p>
            )}
            {next && next !== 'fix' && (next !== 'another' || another) && (
                <p className="form__hint">
                    {item.name} comes off the bill
                    {given ? `; ${given.name} on the house ${sendNow ? 'goes to the kitchen now' : 'waits on the bill for the next send'}` : '. Something else to pay for? Add it from the menu'}.
                    {' '}Loss: {formatMoney(item.price + (given?.price ?? 0))}.
                </p>
            )}
            {error && <p className="form__error" role="alert">{error}</p>}
            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onCancel} disabled={busy}>Back</Button>
                <Button type="submit" disabled={busy || !ready}>
                    {busy ? 'Saving…' : next === 'fix' ? 'Send back to fix' : given ? `Came back · ${given.name} free` : 'Came back'}
                </Button>
            </div>
        </form>
    )
}

export default CameBackForm
