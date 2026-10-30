import { useState } from 'react'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { useKitchen } from '@/pages/taim/hooks/useKitchen'
import { useNow, minutesSince } from '@/pages/taim/hooks/useNow'
import KitchenTicket from '@/pages/taim/components/kitchen-ticket/KitchenTicket'
import Button from '@/components/ui/button/Button'
import { seatLabel } from '@/pages/taim/utils/orders'
import './Kitchen.scss'

/**
 * /taim/kitchen – what the cooks have to make: one ticket per send
 * (a table's round, or a take-out), oldest first, each dish against its
 * prep time. "Served" (advanceDish: Manager, Chef, Cook) takes a dish off;
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

    const { tickets, recentlyServed } = kitchen.data
    const dishes = tickets.reduce((sum, t) => sum + t.dishes.length, 0)

    return (
        <div className="kitchen d-flex flex-column gap-2">
            <div className="d-flex flex-column">
                <h2 className="taim__heading">Kitchen</h2>
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
                                <KitchenTicket ticket={ticket} now={now} onServe={canServe ? kitchen.serve : undefined} />
                            </li>
                        ))}
                    </ul>
                )}

                <RecentlyServed dishes={recentlyServed} now={now} onUndo={canServe ? kitchen.unserve : undefined} />
            </div>
        </div>
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
        <section className="kitchen__served surface d-flex flex-column gap-0-5" aria-labelledby="served-title">
            <h3 id="served-title" className="kitchen__served-title">Recently served</h3>
            {error && <p className="form__error" role="alert">{error}</p>}
            {dishes.length === 0 ? (
                <p className="form__hint">Nothing in the last 10 minutes.</p>
            ) : (
                <ul className="kitchen__served-list">
                    {dishes.map((dish) => (
                        <li key={dish.id} className="kitchen__served-item d-flex align-items-center justify-between gap-0-5">
                            <span className="d-flex flex-column">
                                <strong>{dish.name}</strong>
                                <span className="form__hint">
                                    {dish.title}{dish.title.startsWith('Take-out') ? '' : ` · ${seatLabel(dish.seat)}`} · {agoText(minutesSince(dish.sentOutAt, now))}
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
