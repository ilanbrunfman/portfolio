import { useState } from 'react'
import Button from '@/components/ui/button/Button'
import { minutesSince } from '@/pages/taim/hooks/useNow'
import { clockTime, seatLabel, timing, reasonLabel } from '@/pages/taim/utils/orders'
import './KitchenTicket.scss'

// A ticket nobody started for this long turns amber
const WAIT_ALERT_MINUTES = 5

/**
 * One kitchen ticket: everything one table sent in one round (or one
 * take-out), with each dish's seat and "Served" buttons.
 *
 * Two states:
 *   waiting – nobody started it yet: "Waiting 3 min" and a Start button
 *             (amber after 5 minutes, so nothing sits unnoticed)
 *   started – "Started 20:07 · Yossi"; each dish counts against its prep
 *             time from the start ("8 of 12 min", amber near it, red LATE)
 * The minutes in the header always count from when it was sent: how long
 * the guests have waited. Served works in both states (a drink can go out
 * without a start).
 * A remake (a dish made again, free, because it came back) has a red
 * REMAKE tag on the ticket and "came back: Cold" on the dish; the server
 * lists those tickets first.
 *
 * @param {object} props
 * @param {object} props.ticket          { orderId, title, type, round, firedAt, startedAt, startedBy, dishes: [{ id, name, seat, toGo, startedAt, prepMinutes }] }
 * @param {number} props.now             Current time (ms), so the minutes keep counting.
 * @param {(dishId: number) => Promise} [props.onServe]  Mark a dish served (Manager, Chef, Cook).
 * @param {() => Promise} [props.onStart]                Start the ticket (Chef, Cook).
 * @param {(dishId: number) => Promise} [props.onRedo]   Made wrong: the plate is waste, the dish starts again (Chef, Cook).
 */
const KitchenTicket = ({ ticket, now, onServe, onStart, onRedo }) => {
    const [busy, setBusy] = useState(null) // dish id, 'all', 'start' or 'redo-<id>'
    const [redoing, setRedoing] = useState(null) // the dish whose Redo asks to confirm
    const [error, setError] = useState('')
    const sinceSent = minutesSince(ticket.firedAt, now)
    const started = Boolean(ticket.startedAt)
    // A dish's prep time counts from its own start (or the ticket's)
    const cooking = (dish) => minutesSince(dish.startedAt ?? ticket.startedAt, now)
    const states = ticket.dishes.map((dish) => (started ? timing(cooking(dish), dish.prepMinutes) : 'ok'))
    const ticketState = started
        ? states.includes('late') ? 'late' : states.includes('soon') ? 'soon' : 'ok'
        : sinceSent >= WAIT_ALERT_MINUTES ? 'soon' : 'ok'
    // Every dish on it goes home: say so on the ticket itself
    const allToGo = ticket.type === 'TABLE' && ticket.dishes.every((dish) => dish.toGo)

    const run = async (key, action) => {
        setBusy(key)
        setError('')
        try {
            await action()
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(null)
        }
    }
    const serve = (key, ids) => run(key, async () => { for (const id of ids) await onServe(id) })

    return (
        <article
            className={`kitchen-ticket surface is-${ticketState} ${started ? 'is-started' : 'is-waiting'} d-flex flex-column`}
            aria-label={`${ticket.title}, round ${ticket.round}, ${started ? 'started' : 'waiting'}`}
        >
            <header className="kitchen-ticket__head d-flex justify-between align-items-baseline gap-0-5">
                <span className="d-flex flex-column">
                    <strong className="kitchen-ticket__title">
                        {ticket.title}
                        {ticket.fix && <span className="kitchen-ticket__fix">Fix</span>}
                        {ticket.remake && (
                            <span className="kitchen-ticket__remake">
                                {ticket.dishes.every((dish) => !dish.remake || dish.remake.replaced) ? 'Replacement' : 'Remake'}
                            </span>
                        )}
                        {allToGo && <span className="kitchen-ticket__to-go">To go</span>}
                    </strong>
                    <span className="kitchen-ticket__round">
                        {ticket.type === 'TABLE' ? `Round ${ticket.round} · ` : ''}sent {clockTime(ticket.firedAt)}
                    </span>
                </span>
                <span className="kitchen-ticket__elapsed">{sinceSent} min</span>
            </header>

            <div className="kitchen-ticket__start d-flex align-items-center justify-between gap-0-5">
                {started ? (
                    <span className="kitchen-ticket__started">
                        Started {clockTime(ticket.startedAt)}{ticket.startedBy ? ` · ${ticket.startedBy}` : ''}
                    </span>
                ) : (
                    <>
                        <span className="kitchen-ticket__waiting">Waiting {sinceSent} min</span>
                        {onStart && (
                            <Button size="sm" onClick={() => run('start', onStart)} disabled={busy !== null}>
                                {busy === 'start' ? 'Starting…' : 'Start'}
                            </Button>
                        )}
                    </>
                )}
            </div>

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
                            {dish.fix && (
                                <span className="kitchen-ticket__fix-line">
                                    Fix · {reasonLabel(dish.fix.reason)}{dish.fix.note ? `: "${dish.fix.note}"` : ''}
                                </span>
                            )}
                            {dish.remake && (
                                <span className="kitchen-ticket__came-back">
                                    {dish.remake.replaced ? `Instead of ${dish.remake.replaced}` : 'Remake'} · came back: {reasonLabel(dish.remake.reason)}
                                </span>
                            )}
                            <span className="kitchen-ticket__time">
                                {!started
                                    ? dish.prepMinutes ? `Prep ${dish.prepMinutes} min` : 'No prep time'
                                    : dish.prepMinutes ? `${cooking(dish)} of ${dish.prepMinutes} min` : `${cooking(dish)} min · no prep time`}
                                {states[i] === 'late' && <span className="kitchen-ticket__late">Late</span>}
                            </span>
                        </span>
                        <span className="d-flex flex-column align-items-end gap-0-5">
                            {onServe && (
                                <Button size="sm" variant="secondary" onClick={() => serve(dish.id, [dish.id])} disabled={busy !== null}>
                                    {busy === dish.id ? '…' : 'Served'}
                                </Button>
                            )}
                            {/* Made wrong: Redo asks once, then the plate counts as waste and the dish starts again */}
                            {onRedo && started && (redoing === dish.id ? (
                                <span className="d-flex gap-0-5">
                                    <Button size="sm" variant="ghost" onClick={() => setRedoing(null)} disabled={busy !== null}>No</Button>
                                    <Button size="sm" variant="ghost" className="kitchen-ticket__redo-yes" onClick={() => run(`redo-${dish.id}`, async () => { await onRedo(dish.id); setRedoing(null) })} disabled={busy !== null}>
                                        {busy === `redo-${dish.id}` ? '…' : 'Redo (waste)'}
                                    </Button>
                                </span>
                            ) : (
                                <Button size="sm" variant="ghost" onClick={() => setRedoing(dish.id)} disabled={busy !== null}>Redo</Button>
                            ))}
                        </span>
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
