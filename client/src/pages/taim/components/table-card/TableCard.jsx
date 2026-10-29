import { formatMoney } from '@/pages/taim/utils/money'
import { minutesSince } from '@/pages/taim/hooks/useNow'
import './TableCard.scss'

/**
 * One table on the Floor, as a button. Free: label and seats, outlined in
 * green. Taken: guests, minutes since seated, dishes and the bill so far;
 * red when a dish came back.
 *
 * @param {object} props
 * @param {object} props.table       A table from GET /api/taim/tables (order = its open order or null).
 * @param {number} props.now         Current time (ms), so minutes keep counting.
 * @param {() => void} props.onClick
 * @param {boolean} [props.disabled] e.g. a free table for someone who can't seat guests.
 */
const TableCard = ({ table, now, onClick, disabled = false }) => {
    const { order } = table
    const state = !order ? 'is-free' : order.cameBack > 0 ? 'is-alert' : 'is-taken'

    return (
        <button
            type="button"
            className={`table-card ${state} d-flex flex-column gap-0-5`}
            onClick={onClick}
            disabled={disabled}
            aria-label={
                order
                    ? `${table.label}, taken: ${order.guests} guests, ${formatMoney(order.total)}`
                    : `${table.label}, free, ${table.seats} seats`
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
            ) : (
                <span className="table-card__free">Free</span>
            )}
        </button>
    )
}

export default TableCard
