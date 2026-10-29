import { useState } from 'react'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import { useNow, minutesSince } from '@/pages/taim/hooks/useNow'
import { orderTitle } from '@/pages/taim/utils/orders'
import './Ticket.scss'

const STATUS = {
    PREPARING: { label: 'Preparing', className: 'is-preparing' },
    SENT_OUT: { label: 'Sent out', className: 'is-sent' },
    CAME_BACK: { label: 'Came back', className: 'is-back' },
}

/**
 * The bill of one order: its dishes with their kitchen status, the total,
 * and (when allowed) remove buttons and "Close bill". Used on the Order
 * screen and in the Floor's bill dialog.
 *
 * @param {object} props
 * @param {object} props.order                     An order from the API (items, total, …).
 * @param {(itemId: number) => Promise} [props.onRemove]  Remove a dish (shown only while it's preparing).
 * @param {() => Promise} [props.onClose]          Close the bill (asks to confirm first).
 * @param {string} [props.className]
 */
const Ticket = ({ order, onRemove, onClose, className = '' }) => {
    const now = useNow()
    const [confirming, setConfirming] = useState(false)
    const [busy, setBusy] = useState(null) // 'close' | item id
    const [error, setError] = useState('')
    const isOpen = order.status === 'OPEN'

    const run = async (key, action) => {
        setBusy(key)
        setError('')
        try {
            await action()
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(null)
            setConfirming(false)
        }
    }

    return (
        <section className={`ticket surface d-flex flex-column gap-1 ${className}`} aria-label={`Bill for ${orderTitle(order)}`}>
            <header className="d-flex flex-column">
                <h3 className="ticket__title">{orderTitle(order)}</h3>
                <span className="form__hint">
                    {isOpen ? `Opened ${minutesSince(order.openedAt, now)} min ago by ${order.openedBy.name}` : 'Bill closed'}
                </span>
            </header>

            {error && <p className="form__error" role="alert">{error}</p>}

            {order.items.length === 0 ? (
                <p className="form__hint">No dishes yet.</p>
            ) : (
                <ul className="ticket__lines">
                    {order.items.map((item) => (
                        <li key={item.id} className={`ticket__line d-flex align-items-start gap-0-5 ${STATUS[item.status].className}`}>
                            <div className="ticket__dish d-flex flex-column">
                                <span className="ticket__name">{item.name}</span>
                                <span className={`ticket__status ${STATUS[item.status].className}`}>{STATUS[item.status].label}</span>
                            </div>
                            <span className="ticket__price">{formatMoney(item.price)}</span>
                            {onRemove && isOpen && item.status === 'PREPARING' && (
                                <button
                                    type="button"
                                    className="ticket__remove"
                                    onClick={() => run(item.id, () => onRemove(item.id))}
                                    disabled={busy !== null}
                                    aria-label={`Remove ${item.name}`}
                                    title="Remove (only while it's being prepared)"
                                >
                                    ×
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <div className="ticket__total d-flex justify-between">
                <span>Bill</span>
                <span>{formatMoney(order.total)}</span>
            </div>

            {onClose && isOpen && (
                confirming ? (
                    <div className="d-flex flex-wrap gap-0-5">
                        <Button onClick={() => run('close', onClose)} disabled={busy !== null}>
                            {busy === 'close' ? 'Closing…' : `Close bill · ${formatMoney(order.total)}`}
                        </Button>
                        <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy !== null}>Not yet</Button>
                    </div>
                ) : (
                    <Button variant="secondary" onClick={() => setConfirming(true)}>Close bill</Button>
                )
            )}
        </section>
    )
}

export default Ticket
