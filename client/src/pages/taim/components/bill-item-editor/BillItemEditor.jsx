import { useState } from 'react'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import { valueFromSeat } from '@/pages/taim/utils/orders'

/**
 * Edit one dish on the bill: move it to another seat (any time while the
 * bill is open) or remove it (only while the kitchen is still preparing
 * it). Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {object} props.item                           A dish on the order ({ name, price, seat, status }).
 * @param {{ value: string, label: string }[]} props.seats  Seat choices ([] for a take-out).
 * @param {(seat: string) => Promise} props.onMove      Save a new seat value; throws on failure.
 * @param {() => Promise} props.onRemove                Remove the dish; throws on failure.
 * @param {() => void} props.onDone                     Called after saving/removing, and on Close.
 */
const BillItemEditor = ({ item, seats, onMove, onRemove, onDone }) => {
    const [seat, setSeat] = useState(valueFromSeat(item.seat))
    const [confirmRemove, setConfirmRemove] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const canRemove = item.status === 'PREPARING'
    const changed = seat !== valueFromSeat(item.seat)

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

    return (
        <div className="d-flex flex-column gap-1">
            <p className="form__hint">
                {formatMoney(item.price)} · {item.status === 'PREPARING' ? 'being prepared' : item.status === 'SENT_OUT' ? 'sent out' : 'came back'}
            </p>
            {error && <p className="form__error" role="alert">{error}</p>}

            {seats.length > 0 && <RadioGroup label="For" options={seats} value={seat} onChange={setSeat} direction="row" />}

            {!canRemove && (
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
                {seats.length > 0 && (
                    <Button onClick={() => run(() => onMove(seat))} disabled={busy || !changed}>
                        Save seat
                    </Button>
                )}
            </div>
        </div>
    )
}

export default BillItemEditor
