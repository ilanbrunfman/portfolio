import { useState } from 'react'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { useKitchen } from '@/pages/taim/hooks/useKitchen'
import { useNow, minutesSince } from '@/pages/taim/hooks/useNow'
import KitchenTicket from '@/pages/taim/components/kitchen-ticket/KitchenTicket'
import Button from '@/components/ui/button/Button'
import { seatLabel } from '@/pages/taim/utils/orders'
import './Kitchen.scss'

/**
 * /taim/kitchen – what the cooks have to make (the Manager only looks:
 * "View only", no Start, Served, Undo or Fire): one ticket per send
 * (a table's round, or a take-out), oldest first, each dish against its
 * prep time. "Served" (advanceDish: Manager, Chef, Cook) takes a dish off;
 * "Coming up" lists dishes the waiters are holding back (mains while the
 * starters are eaten), so the cooks can plan; they become a ticket when fired.
 * The Chef (fireHeld) can fire them from here once nothing of that table is
 * cooking and its last dish was served 10+ minutes ago.
 * "Recently served" keeps the last 10 minutes so a wrong tap can be undone.
 * Reloads every 5 seconds so new orders show up on their own.
 */
const Kitchen = () => {
    const kitchen = useKitchen()
    const { can } = useStaff()
    const now = useNow(15_000)
    const canServe = can('advanceDish')

    if (kitchen.error && !kitchen.data) {
        return (
            <div className="taim__notice surface d-flex flex-column gap-1 align-items-start" role="alert">
                <p>Couldn't load the kitchen: {kitchen.error}</p>
                <Button variant="secondary" onClick={kitchen.reload}>Try again</Button>
            </div>
        )
    }
    if (!kitchen.data) return <p role="status">Loading the kitchen…</p>

    const { tickets, onHold, recentlyServed, fireAfterMinutes } = kitchen.data
    const dishes = tickets.reduce((sum, t) => sum + t.dishes.length, 0)

    return (
        <div className="kitchen d-flex flex-column gap-2">
            <div className="d-flex flex-column">
                <h2 className="taim__heading d-flex align-items-center gap-0-5">
                    Kitchen
                    {!canServe && <span className="taim__view-only">View only</span>}
                </h2>
                <span className="form__hint">
                    {dishes} {dishes === 1 ? 'dish' : 'dishes'} to make · {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
                </span>
            </div>

            {kitchen.error && <p className="form__error" role="alert">Couldn't refresh: {kitchen.error}</p>}

            <div className="d-flex flex-wrap align-items-start gap-2">
                {tickets.length === 0 ? (
                    <div className="kitchen__empty surface">
                        <p className="form__hint">Nothing to cook. New orders show up here when a waiter sends them.</p>
                    </div>
                ) : (
                    <ul className="kitchen__tickets" aria-label="Tickets">
                        {tickets.map((ticket) => (
                            <li key={`${ticket.orderId}-${ticket.round}`}>
                                <KitchenTicket
                                    ticket={ticket}
                                    now={now}
                                    onServe={canServe ? kitchen.serve : undefined}
                                    onStart={canServe ? () => kitchen.start(ticket.orderId, ticket.round) : undefined}
                                />
                            </li>
                        ))}
                    </ul>
                )}

                <div className="kitchen__side d-flex flex-column gap-1">
                    {onHold.length > 0 && (
                        <ComingUp orders={onHold} now={now} fireAfter={fireAfterMinutes} onFire={can('fireHeld') ? kitchen.fire : undefined} />
                    )}
                    <RecentlyServed dishes={recentlyServed} now={now} onUndo={canServe ? kitchen.unserve : undefined} />
                </div>
            </div>
        </div>
    )
}

/**
 * Why the kitchen can't fire this order's held dishes yet, or null if it can:
 * something of the table is still cooking, or its last dish was served less
 * than `fireAfter` minutes ago (the guests are still eating).
 */
function notYet(order, now, fireAfter) {
    if (order.cooking > 0) return 'Still cooking for this table'
    if (!order.lastServedAt) return null
    const minutes = minutesSince(order.lastServedAt, now)
    return minutes < fireAfter ? `Served ${minutes} min ago: fire from ${fireAfter} min` : null
}

/**
 * Held dishes per order: not cooking yet, but the cooks can plan for them.
 * With onFire (Chef, Manager) each order gets "Fire", disabled with the
 * reason until the table is ready for it.
 */
const ComingUp = ({ orders, now, fireAfter, onFire }) => {
    const [busy, setBusy] = useState(null)
    const [error, setError] = useState('')

    const fire = async (orderId) => {
        setBusy(orderId)
        setError('')
        try {
            await onFire(orderId)
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(null)
        }
    }

    return (
        <section className="kitchen__panel kitchen__coming surface d-flex flex-column gap-0-5" aria-labelledby="coming-title">
            <h3 id="coming-title" className="kitchen__panel-title">Coming up · on hold</h3>
            {error && <p className="form__error" role="alert">{error}</p>}
            <ul className="kitchen__panel-list">
                {orders.map((order) => {
                    const reason = notYet(order, now, fireAfter)
                    return (
                        <li key={order.orderId} className="kitchen__panel-item d-flex flex-column gap-0-5">
                            <span className="d-flex align-items-center justify-between gap-0-5">
                                <strong>{order.title}</strong>
                                {onFire && (
                                    <Button size="sm" variant="secondary" onClick={() => fire(order.orderId)} disabled={busy !== null || reason !== null}>
                                        {busy === order.orderId ? 'Firing…' : 'Fire'}
                                    </Button>
                                )}
                            </span>
                            <span className="form__hint">
                                {order.dishes
                                    .map((dish) => `${dish.name}${order.type === 'TABLE' ? ` (${seatLabel(dish.seat)}${dish.toGo ? ', to go' : ''})` : ''}${dish.prepMinutes ? ` · ${dish.prepMinutes} min` : ''}`)
                                    .join(', ')}
                            </span>
                            {onFire && reason && <span className="kitchen__not-yet">{reason}</span>}
                        </li>
                    )
                })}
            </ul>
            <p className="form__hint">
                {onFire
                    ? `They become a ticket when the waiter fires them, or when you do: once the table's dishes were served ${fireAfter}+ min ago.`
                    : 'They become a ticket when the waiter fires them.'}
            </p>
        </section>
    )
}

/** "just now" / "3 min ago" */
const agoText = (minutes) => (minutes === 0 ? 'just now' : `${minutes} min ago`)

/** Dishes served in the last 10 minutes, newest first, each with Undo */
const RecentlyServed = ({ dishes, now, onUndo }) => {
    const [busy, setBusy] = useState(null)
    const [error, setError] = useState('')

    const undo = async (id) => {
        setBusy(id)
        setError('')
        try {
            await onUndo(id)
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(null)
        }
    }

    return (
        <section className="kitchen__panel surface d-flex flex-column gap-0-5" aria-labelledby="served-title">
            <h3 id="served-title" className="kitchen__panel-title">Recently served</h3>
            {error && <p className="form__error" role="alert">{error}</p>}
            {dishes.length === 0 ? (
                <p className="form__hint">Nothing in the last 10 minutes.</p>
            ) : (
                <ul className="kitchen__panel-list">
                    {dishes.map((dish) => (
                        <li key={dish.id} className="kitchen__panel-item d-flex align-items-center justify-between gap-0-5">
                            <span className="d-flex flex-column">
                                <strong>{dish.name}</strong>
                                <span className="form__hint">
                                    {dish.title}{dish.title.startsWith('Take-out') ? '' : ` · ${seatLabel(dish.seat)}`}{dish.toGo ? ' · to go' : ''} · {agoText(minutesSince(dish.sentOutAt, now))}
                                </span>
                            </span>
                            {onUndo && (
                                <Button size="sm" variant="ghost" onClick={() => undo(dish.id)} disabled={busy !== null}>
                                    {busy === dish.id ? '…' : 'Undo'}
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

export default Kitchen
