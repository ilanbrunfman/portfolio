import { useState } from 'react'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import Button from '@/components/ui/button/Button'
import CameBackForm from '@/pages/taim/components/came-back-form/CameBackForm'
import { formatMoney } from '@/pages/taim/utils/money'
import { valueFromSeat, clockTime, reasonLabel } from '@/pages/taim/utils/orders'
import './BillItemEditor.scss'

/** "Sent 20:05 (Lior) · started 20:07 (Yossi) · served 20:19 (Avi)" – as far as it got */
function timeline(item) {
    const step = (label, at, by) => (at ? `${label} ${clockTime(at)}${by ? ` (${by})` : ''}` : null)
    return [step('Sent', item.firedAt, item.firedBy), step('started', item.startedAt, item.startedBy), step('served', item.sentOutAt, item.servedBy)]
        .filter(Boolean)
        .join(' · ')
}

/**
 * Edit one dish on the bill: move it to another seat or make it to go (or
 * not), any time while the bill is open; or remove it (before it's sent to
 * the kitchen, or while the kitchen is preparing it). Meant to sit inside a
 * <Modal>.
 * Step 6: a served dish can come back (the CameBackForm: why, and make it
 * again or not); a dish that came back shows why, with "Undo came back"
 * for a mistake; a free remake says so.
 *
 * @param {object} props
 * @param {object} props.item                           A dish on the order ({ name, price, seat, status, toGo }).
 * @param {{ value: string, label: string }[]} props.seats  Seat choices ([] for a take-out).
 * @param {({ seat: string, toGo: boolean }) => Promise} props.onSave  Save the seat value and to go; throws on failure.
 * @param {() => Promise} props.onRemove                Remove the dish; throws on failure.
 * @param {(data: { reason, note, remake }) => Promise} [props.onCameBack]  Record that it came back (markCameBack).
 * @param {() => Promise} [props.onUndoCameBack]        Undo a came back marked by mistake (markCameBack).
 * @param {() => void} props.onDone                     Called after saving/removing, and on Close.
 */
const BillItemEditor = ({ item, seats, onSave, onRemove, onCameBack, onUndoCameBack, onDone }) => {
    const [cameBack, setCameBack] = useState(false) // the came-back form is open
    const [seat, setSeat] = useState(valueFromSeat(item.seat))
    const [toGo, setToGo] = useState(Boolean(item.toGo))
    const [confirmRemove, setConfirmRemove] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const canRemove = item.status === 'NEW' || item.status === 'PREPARING'
    const returned = item.status === 'CAME_BACK'
    const changed = seat !== valueFromSeat(item.seat) || toGo !== Boolean(item.toGo)

    const run = async (action) => {
        setBusy(true)
        setError('')
        try {
            await action()
            onDone()
        } catch (err) {
            setError(err.message)
            setBusy(false)
            setConfirmRemove(false)
        }
    }

    if (cameBack) {
        return <CameBackForm item={item} onSubmit={(data) => run(() => onCameBack(data))} onCancel={() => setCameBack(false)} />
    }

    return (
        <div className="d-flex flex-column gap-1">
            <p className="form__hint">
                {item.remakeOfId ? 'Free remake (on the house)' : formatMoney(item.price)} · {{ NEW: 'not sent to the kitchen yet', PREPARING: 'in the kitchen', SENT_OUT: 'served', CAME_BACK: 'came back' }[item.status]}
            </p>
            {item.firedAt && <p className="form__hint">{timeline(item)}</p>}
            {returned && item.returned && (
                <p className="bill-item-editor__returned">
                    Came back: {reasonLabel(item.returned.reason)}
                    {item.returned.note && ` · "${item.returned.note}"`} · {item.returned.by}, {clockTime(item.returned.at)}. Not on the bill.
                </p>
            )}
            {error && <p className="form__error" role="alert">{error}</p>}

            {!returned && seats.length > 0 && <RadioGroup label="For" options={seats} value={seat} onChange={setSeat} direction="row" />}
            {!returned && seats.length > 0 && (
                <Checkbox label="To go" checked={toGo} onChange={(e) => setToGo(e.target.checked)} />
            )}

            {item.status === 'SENT_OUT' && onCameBack && (
                <div className="d-flex flex-wrap align-items-center gap-0-5">
                    <Button variant="secondary" size="sm" onClick={() => setCameBack(true)} disabled={busy}>Came back…</Button>
                    <span className="form__hint">The guest gave it back</span>
                </div>
            )}

            {returned && onUndoCameBack && (
                <div className="d-flex flex-wrap gap-0-5">
                    <Button variant="ghost" size="sm" onClick={() => run(onUndoCameBack)} disabled={busy}>
                        {busy ? 'Undoing…' : 'Undo came back'}
                    </Button>
                </div>
            )}

            {!canRemove && !returned && (
                <p className="form__hint">The kitchen already sent it out, so it stays on the bill.</p>
            )}

            {canRemove && (
                <div className="d-flex flex-wrap gap-0-5">
                    {confirmRemove ? (
                        <>
                            <Button variant="secondary" size="sm" onClick={() => run(onRemove)} disabled={busy}>
                                {busy ? 'Removing…' : `Yes, remove ${item.name}`}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)} disabled={busy}>Keep it</Button>
                        </>
                    ) : (
                        <Button variant="ghost" size="sm" icon="IconTrash" onClick={() => setConfirmRemove(true)} disabled={busy}>
                            Remove from bill
                        </Button>
                    )}
                </div>
            )}

            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onDone} disabled={busy}>Close</Button>
                {seats.length > 0 && !returned && (
                    <Button onClick={() => run(() => onSave({ seat, toGo }))} disabled={busy || !changed}>
                        Save
                    </Button>
                )}
            </div>
        </div>
    )
}

export default BillItemEditor
