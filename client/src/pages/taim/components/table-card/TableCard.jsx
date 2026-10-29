import { formatMoney } from '@/pages/taim/utils/money'
import { minutesSince } from '@/pages/taim/hooks/useNow'
import './TableCard.scss'

/**
 * One table on the Floor, as a button, in one of three colours:
 *   green  = ready: free and clean, can be seated
 *   yellow = needs cleaning: the guests left, not cleaned yet
 *   grey   = dining: guests, minutes since seated, dishes and the bill so far
 * A small red tag shows when a dish came back.
 *
 * @param {object} props
 * @param {object} props.table       A table from GET /api/taim/tables (order = its open order or null).
 * @param {number} props.now         Current time (ms), so minutes keep counting.
 * @param {() => void} props.onClick
 * @param {boolean} [props.disabled] e.g. a free table for someone who can't seat guests.
 */
const TableCard = ({ table, now, onClick, disabled = false }) => {
    const { order } = table
    const state = order ? 'is-dining' : table.needsCleaning ? 'is-cleaning' : 'is-free'

    return (
        <button
            type="button"
            className={`table-card ${state} d-flex flex-column gap-0-5`}
            onClick={onClick}
            disabled={disabled}
            aria-label={
                order
                    ? `${table.label}, dining: ${order.guests} guests, ${formatMoney(order.total)}`
                    : table.needsCleaning
                        ? `${table.label}, needs cleaning`
                        : `${table.label}, ready, ${table.seats} seats`
            }
        >
            <span className="d-flex justify-between align-items-baseline gap-0-5">
                <span className="table-card__label">{table.label}</span>
                <span className="table-card__seats">{table.seats} seats</span>
            </span>
            {order ? (
                <>
                    <span className="table-card__meta">
                        {order.guests} {order.guests === 1 ? 'guest' : 'guests'} · {minutesSince(order.openedAt, now)} min
                    </span>
                    <span className="table-card__meta">
                        {order.dishCount} {order.dishCount === 1 ? 'dish' : 'dishes'} · {formatMoney(order.total)}
                    </span>
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

export default TableCard
