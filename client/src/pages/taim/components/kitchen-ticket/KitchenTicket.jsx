import { useState } from 'react'
import Button from '@/components/ui/button/Button'
import { minutesSince } from '@/pages/taim/hooks/useNow'
import { clockTime, seatLabel, timing } from '@/pages/taim/utils/orders'
import './KitchenTicket.scss'

/**
 * One kitchen ticket: everything one table sent in one round (or one
 * take-out), with each dish's seat and time against its prep time, and
 * "Served" buttons. The ticket turns red when any dish is late.
 *
 * @param {object} props
 * @param {object} props.ticket          { title, type, round, firedAt, dishes: [{ id, name, seat, prepMinutes }] }
 * @param {number} props.now             Current time (ms), so the minutes keep counting.
 * @param {(dishId: number) => Promise} [props.onServe]  Mark a dish served (Manager, Chef, Cook).
 */
const KitchenTicket = ({ ticket, now, onServe }) => {
    const [busy, setBusy] = useState(null) // dish id, or 'all'
    const [error, setError] = useState('')
    const elapsed = minutesSince(ticket.firedAt, now)
    const states = ticket.dishes.map((dish) => timing(elapsed, dish.prepMinutes))
    const ticketState = states.includes('late') ? 'late' : states.includes('soon') ? 'soon' : 'ok'
    // Every dish on it goes home: say so on the ticket itself
    const allToGo = ticket.type === 'TABLE' && ticket.dishes.every((dish) => dish.toGo)

    const serve = async (key, ids) => {
        setBusy(key)
        setError('')
        try {
            for (const id of ids) await onServe(id)
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(null)
        }
    }

    return (
        <article className={`kitchen-ticket surface is-${ticketState} d-flex flex-column`} aria-label={`${ticket.title}, round ${ticket.round}`}>
            <header className="kitchen-ticket__head d-flex justify-between align-items-baseline gap-0-5">
                <span className="d-flex flex-column">
                    <strong className="kitchen-ticket__title">
                        {ticket.title}
                        {allToGo && <span className="kitchen-ticket__to-go">To go</span>}
                    </strong>
                    <span className="kitchen-ticket__round">
                        {ticket.type === 'TABLE' ? `Round ${ticket.round} · ` : ''}sent {clockTime(ticket.firedAt)}
                    </span>
                </span>
                <span className="kitchen-ticket__elapsed">{elapsed} min</span>
            </header>

            {error && <p className="form__error kitchen-ticket__error" role="alert">{error}</p>}

            <ul className="kitchen-ticket__dishes">
                {ticket.dishes.map((dish, i) => (
                    <li key={dish.id} className={`kitchen-ticket__dish is-${states[i]} d-flex align-items-center gap-0-5`}>
                        <span className="kitchen-ticket__dish-text d-flex flex-column">
                            <span className="kitchen-ticket__name">
                                {dish.name}
                                {ticket.type === 'TABLE' && <span className="kitchen-ticket__seat">{seatLabel(dish.seat)}</span>}
                                {dish.toGo && !allToGo && <span className="kitchen-ticket__to-go">To go</span>}
                            </span>
                            <span className="kitchen-ticket__time">
                                {dish.prepMinutes ? `${elapsed} of ${dish.prepMinutes} min` : `${elapsed} min · no prep time`}
                                {states[i] === 'late' && <span className="kitchen-ticket__late">Late</span>}
                            </span>
                        </span>
                        {onServe && (
                            <Button size="sm" variant="secondary" onClick={() => serve(dish.id, [dish.id])} disabled={busy !== null}>
                                {busy === dish.id ? '…' : 'Served'}
                            </Button>
                        )}
                    </li>
                ))}
            </ul>

            {onServe && ticket.dishes.length > 1 && (
                <div className="kitchen-ticket__foot d-flex justify-end">
                    <Button size="sm" variant="ghost" onClick={() => serve('all', ticket.dishes.map((d) => d.id))} disabled={busy !== null}>
                        {busy === 'all' ? 'Serving…' : `Serve all ${ticket.dishes.length}`}
                    </Button>
                </div>
            )}
        </article>
    )
}

export default KitchenTicket
