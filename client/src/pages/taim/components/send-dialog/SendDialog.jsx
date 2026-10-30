import { useState } from 'react'
import Button from '@/components/ui/button/Button'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import { seatLabel } from '@/pages/taim/utils/orders'
import './SendDialog.scss'

/**
 * "Send to kitchen" when there's a choice: the dishes not sent yet, by menu
 * category, each ticked to go now. Unticked dishes are put on hold until
 * the waiter fires them (starters now, mains later). "Hold Mains" unticks
 * a whole category in one tap. Dishes already on hold start unticked.
 *
 * @param {object} props
 * @param {object[]} props.items      The order's dishes not sent yet (status NEW).
 * @param {boolean} props.atTable     Show seat tags (not on a take-out).
 * @param {(itemIds: number[]) => Promise} props.onSend  Throws on failure.
 * @param {() => void} props.onDone   Close the dialog.
 */
const SendDialog = ({ items, atTable, onSend, onDone }) => {
    const [picked, setPicked] = useState(() => new Set(items.filter((item) => !item.held).map((item) => item.id)))
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    // Categories in the order the dishes were added
    const categories = [...new Set(items.map((item) => item.category))]
    const inCategory = (name) => items.filter((item) => item.category === name)
    const allPicked = (name) => inCategory(name).every((item) => picked.has(item.id))

    const toggle = (id) =>
        setPicked((ids) => {
            const next = new Set(ids)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })

    /** "Hold Mains" ↔ "Send Mains" */
    const toggleCategory = (name) =>
        setPicked((ids) => {
            const next = new Set(ids)
            const hold = allPicked(name)
            for (const item of inCategory(name)) {
                if (hold) next.delete(item.id)
                else next.add(item.id)
            }
            return next
        })

    const held = items.length - picked.size

    const send = async () => {
        setBusy(true)
        setError('')
        try {
            await onSend([...picked])
            onDone()
        } catch (err) {
            setError(err.message)
            setBusy(false)
        }
    }

    return (
        <div className="send-dialog d-flex flex-column gap-1">
            <p className="form__hint">Untick what should wait: it stays on hold until you fire it.</p>

            {categories.map((name) => (
                <section key={name} className="send-dialog__group" aria-label={name}>
                    <div className="send-dialog__group-head d-flex align-items-center justify-between gap-0-5">
                        <h4 className="send-dialog__category">{name}</h4>
                        {categories.length > 1 && (
                            <Button size="sm" variant="ghost" onClick={() => toggleCategory(name)} disabled={busy}>
                                {allPicked(name) ? `Hold ${name}` : `Send ${name}`}
                            </Button>
                        )}
                    </div>
                    <ul className="send-dialog__dishes">
                        {inCategory(name).map((item) => (
                            <li key={item.id} className={picked.has(item.id) ? '' : 'is-held'}>
                                <Checkbox
                                    checked={picked.has(item.id)}
                                    onChange={() => toggle(item.id)}
                                    disabled={busy}
                                    label={
                                        <>
                                            {item.name}
                                            {atTable && <span className="send-dialog__seat">{seatLabel(item.seat)}</span>}
                                            {!picked.has(item.id) && <span className="send-dialog__hold">On hold</span>}
                                        </>
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                </section>
            ))}

            {error && <p className="form__error" role="alert">{error}</p>}

            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onDone} disabled={busy}>Cancel</Button>
                <Button onClick={send} disabled={busy || picked.size === 0}>
                    {busy ? 'Sending…' : `Send ${picked.size}${held > 0 ? `, hold ${held}` : ''}`}
                </Button>
            </div>
        </div>
    )
}

export default SendDialog
