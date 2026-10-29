import { formatMoney } from '@/pages/taim/utils/money'
import { minutesSince } from '@/pages/taim/hooks/useNow'
import { seatsText } from '@/pages/taim/utils/orders'
import './TableCard.scss'

/**
 * One table on the Floor, as a button, in one of three colours:
 *   green  = ready: free and clean, can be seated
 *   yellow = needs cleaning: the guests left, not cleaned yet
 *   grey   = dining: guests, minutes since seated, dishes and the bill so far
 * A dining table also shows how its food is coming along, so the waiter
 * knows whom to ask the kitchen about: "2 not sent", "In kitchen: 3 ·
 * 14 min" with the seats still waiting, or "All served". A small red tag
 * shows when a dish came back.
 *
 * @param {object} props
 * @param {object} props.table       A table from GET /api/taim/tables (order = its open order or null).
 * @param {number} props.now         Current time (ms), so minutes keep counting.
 * @param {() => void} props.onClick
 * @param {boolean} [props.disabled] e.g. a free table for someone who can't seat guests.
 * @param {boolean} [props.selected] While combining tables: picked (undefined = not choosing).
 *
 * Combined tables come as their main table with groupLabel ("T1 + T4 + T7")
 * and groupSeats; the card shows those and a "Combined" tag.
 */
const TableCard = ({ table, now, onClick, disabled = false, selected }) => {
    const { order } = table
    const state = order ? 'is-dining' : table.needsCleaning ? 'is-cleaning' : 'is-free'
    const label = table.groupLabel ?? table.label
    const seats = table.groupSeats ?? table.seats
    const combined = table.joined?.length > 0

    return (
        <button
            type="button"
            className={`table-card ${state} ${selected ? 'is-selected' : ''} d-flex flex-column gap-0-5`}
            onClick={onClick}
            disabled={disabled}
            aria-pressed={selected}
            aria-label={
                order
                    ? `${label}, dining: ${order.guests} guests, ${formatMoney(order.total)}`
                    : table.needsCleaning
                        ? `${label}, needs cleaning`
                        : `${label}, ready, ${seats} seats`
            }
        >
            <span className="d-flex flex-wrap justify-between align-items-baseline gap-0-5">
                <span className={`table-card__label ${combined ? 'table-card__label--group' : ''}`}>{label}</span>
                <span className="table-card__seats">{seats} seats</span>
            </span>
            {combined && <span className="table-card__combined">Combined</span>}
            {order ? (
                <>
                    <span className="table-card__meta">
                        {order.guests} {order.guests === 1 ? 'guest' : 'guests'} · {minutesSince(order.openedAt, now)} min
                    </span>
                    <span className="table-card__meta">
                        {order.dishCount} {order.dishCount === 1 ? 'dish' : 'dishes'} · {formatMoney(order.total)}
                    </span>
                    <KitchenProgress order={order} now={now} />
                    {order.cameBack > 0 && (
                        <span className="table-card__alert">
                            {order.cameBack} came back
                        </span>
                    )}
                </>
            ) : table.needsCleaning ? (
                <span className="table-card__cleaning">Needs cleaning</span>
            ) : (
                <span className="table-card__free">Ready</span>
            )}
        </button>
    )
}

/**
 * How a dining table's (or take-out's) food is coming along, from the floor
 * summary: { notSent, inKitchen, waitingSince, waitingSeats, dishCount }.
 */
export const KitchenProgress = ({ order, now }) => {
    if (order.dishCount === 0) return null
    const served = order.notSent === 0 && order.inKitchen === 0
    return (
        <span className="table-card__progress d-flex flex-column">
            {order.notSent > 0 && <span className="table-card__not-sent">{order.notSent} not sent</span>}
            {order.inKitchen > 0 && (
                <>
                    <span className="table-card__kitchen">
                        In kitchen: {order.inKitchen} · {minutesSince(order.waitingSince, now)} min
                    </span>
                    {order.waitingSeats.length > 0 && (
                        <span className="table-card__waiting">Waiting: {seatsText(order.waitingSeats)}</span>
                    )}
                </>
            )}
            {served && <span className="table-card__served">All served</span>}
        </span>
    )
}

export default TableCard
