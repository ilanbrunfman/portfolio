import { useState } from 'react'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import { useNow, minutesSince } from '@/pages/taim/hooks/useNow'
import { orderTitle, groupByRound, seatLabel, clockTime } from '@/pages/taim/utils/orders'
import './Ticket.scss'

const STATUS = {
    NEW: { label: 'Not sent', className: 'is-new' },
    HELD: { label: 'On hold', className: 'is-held' }, // NEW, but waiting for "Fire"
    PREPARING: { label: 'In kitchen', className: 'is-preparing' },
    SENT_OUT: { label: 'Served', className: 'is-sent' },
    CAME_BACK: { label: 'Came back', className: 'is-back' },
}

/** The dish's STATUS entry (a held dish counts as "On hold") */
const statusOf = (item) => STATUS[item.held ? 'HELD' : item.status]

/** "Not sent", "On hold", "In kitchen · 14 min", "Served", "Came back" */
const statusText = (item, now) =>
    item.status === 'PREPARING' && item.firedAt
        ? `${STATUS.PREPARING.label} · ${minutesSince(item.firedAt, now)} min`
        : statusOf(item).label

/**
 * The bill of one order: its dishes in the order they were sent to the
 * kitchen – Round 1 (e.g. starters, sent 20:05), Round 2 (the mains added
 * later)…, then the ones on hold (mains waiting for "Fire"), then the ones
 * not sent yet – each with its seat (at a table) and where it is: not sent,
 * on hold, in the kitchen (and for how long), served, came back. Then the
 * total.
 * When allowed: "Send to kitchen (n)" for the dishes not sent yet (the
 * Order screen opens a popup to send or hold them), "Fire held (n)" for the
 * ones on hold, and "Close bill" → a green "Pay · $40.00"
 * to take the payment (refused while dishes haven't been sent). Used on the
 * Order screen and in the Floor's bill dialog.
 *
 * @param {object} props
 * @param {object} props.order                          An order from the API (items, total, …).
 * @param {(item: object) => void} [props.onEditItem]   Makes each dish tappable (change its seat, remove it).
 * @param {() => Promise|void} [props.onSend]           Send the dishes not sent yet (may open a dialog to hold some).
 * @param {() => Promise} [props.onFire]                Send the dishes on hold.
 * @param {() => Promise} [props.onClose]               Close the bill (asks to confirm first).
 * @param {string} [props.className]
 */
const Ticket = ({ order, onEditItem, onSend, onFire, onClose, className = '' }) => {
    const now = useNow()
    const [confirming, setConfirming] = useState(false)
    const [busy, setBusy] = useState(null) // 'send' | 'fire' | 'close'
    const [error, setError] = useState('')
    const isOpen = order.status === 'OPEN'
    const notSent = order.items.filter((item) => item.status === 'NEW' && !item.held).length
    const onHold = order.items.filter((item) => item.held).length

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
                {order.customerPhone && (
                    // A link, so a tap calls the customer on a phone
                    <a className="ticket__phone" href={`tel:${order.customerPhone.replace(/[\s-]/g, '')}`}>{order.customerPhone}</a>
                )}
            </header>

            {error && <p className="form__error" role="alert">{error}</p>}

            {order.items.length === 0 ? (
                <p className="form__hint">No dishes yet.</p>
            ) : (
                groupByRound(order).map((group) => (
                    <div key={group.key} className={`ticket__group ${group.key === 'on-hold' ? 'is-held' : ''}`}>
                        <h4 className="ticket__round d-flex justify-between gap-0-5">
                            <span>
                                {group.title}
                                {group.kitchenFiredBy && <span className="ticket__fired-by"> · fired by kitchen ({group.kitchenFiredBy})</span>}
                            </span>
                            {group.sentAt && <span className="ticket__round-time">sent {clockTime(group.sentAt)}</span>}
                        </h4>
                        <ul className="ticket__lines">
                            {group.items.map((item) => {
                                const content = (
                                    <>
                                        <span className="ticket__dish d-flex flex-column">
                                            <span className="ticket__name">
                                                {item.name}
                                                {order.type === 'TABLE' && <span className="ticket__seat-tag">{seatLabel(item.seat)}</span>}
                                            </span>
                                            <span className={`ticket__status ${statusOf(item).className}`}>{statusText(item, now)}</span>
                                        </span>
                                        <span className="ticket__price">{formatMoney(item.price)}</span>
                                    </>
                                )
                                return (
                                    <li key={item.id} className={`ticket__line ${statusOf(item).className}`}>
                                        {onEditItem && isOpen ? (
                                            // Tappable: the whole line is one button
                                            <button
                                                type="button"
                                                className="ticket__line-button d-flex align-items-start gap-0-5"
                                                onClick={() => onEditItem(item)}
                                                aria-label={`${item.name}${order.type === 'TABLE' ? `, ${seatLabel(item.seat)}` : ''}, ${statusText(item, now)}, ${formatMoney(item.price)}. Edit`}
                                            >
                                                {content}
                                            </button>
                                        ) : (
                                            <div className="d-flex align-items-start gap-0-5">{content}</div>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                ))
            )}

            <div className="ticket__total d-flex justify-between">
                <span>Bill</span>
                <span>{formatMoney(order.total)}</span>
            </div>

            {onSend && isOpen && notSent > 0 && (
                <Button onClick={() => run('send', onSend)} disabled={busy !== null}>
                    {busy === 'send' ? 'Sending…' : `Send to kitchen (${notSent})`}
                </Button>
            )}

            {onFire && isOpen && onHold > 0 && (
                <Button variant={notSent > 0 ? 'secondary' : 'primary'} className="ticket__fire" onClick={() => run('fire', onFire)} disabled={busy !== null}>
                    {busy === 'fire' ? 'Firing…' : `Fire held (${onHold})`}
                </Button>
            )}

            {onClose && isOpen && (
                notSent + onHold > 0 ? (
                    <p className="form__hint">
                        {onHold > 0 ? 'Fire, send or remove' : 'Send or remove'} the dishes not sent yet before closing the bill.
                    </p>
                ) : confirming ? (
                    <div className="d-flex flex-wrap gap-0-5">
                        <Button className="ticket__pay" onClick={() => run('close', onClose)} disabled={busy !== null}>
                            {busy === 'close' ? 'Saving…' : `Pay · ${formatMoney(order.total)}`}
                        </Button>
                        <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy !== null}>Not yet</Button>
                    </div>
                ) : (
                    <Button variant={onSend ? 'ghost' : 'secondary'} onClick={() => setConfirming(true)}>Close bill</Button>
                )
            )}
        </section>
    )
}

export default Ticket
