import { Link } from 'react-router-dom'
import { KitchenProgress } from '@/pages/taim/components/table-card/TableCard'
import { minutesSince } from '@/pages/taim/hooks/useNow'
import { formatMoney } from '@/pages/taim/utils/money'
import { orderTitle, kitchenProgress } from '@/pages/taim/utils/orders'
import './OrderCard.scss'

/**
 * One open order on the Order screen, as a card like the Floor's tables:
 * the table (or take-out), guests and minutes, dishes and the bill so far,
 * and how the food is coming along – not sent, on hold, in the kitchen (and
 * for how long, which seats wait), to go, fired by the kitchen – or blue
 * "All served" / "Ready for pickup" when nothing is left to come. A red tag
 * counts dishes that came back. Who opened it shows when it isn't you.
 * The whole card links to the order.
 *
 * @param {object} props
 * @param {object} props.order   An open order from GET /api/taim/orders (with items).
 * @param {number} props.now     Current time (ms), so minutes keep counting.
 * @param {boolean} [props.mine] Opened by the person using the app (hides "by …").
 */
const OrderCard = ({ order, now, mine = false }) => {
    const progress = kitchenProgress(order.items)
    const takeout = order.type === 'TAKEOUT'
    const allServed = progress.dishCount > 0 && progress.notSent === 0 && progress.onHold === 0 && progress.inKitchen === 0
    const state = progress.dishCount === 0 ? 'is-empty' : allServed ? 'is-served' : 'is-dining'

    return (
        <Link
            to={`/taim/order/${order.id}`}
            className={`order-card ${state} d-flex flex-column gap-0-5`}
            aria-label={`${orderTitle(order)}, ${progress.dishCount} dishes, ${formatMoney(order.total)}${allServed ? `, ${takeout ? 'ready for pickup' : 'all served'}` : ''}. Open the order`}
        >
            <span className="d-flex justify-between align-items-baseline gap-0-5">
                <span className="order-card__title">{takeout ? order.customerName : order.table.label}</span>
                <span className="order-card__total">{formatMoney(order.total)}</span>
            </span>
            <span className="order-card__meta">
                {takeout ? 'Take-out' : `${order.guests} ${order.guests === 1 ? 'guest' : 'guests'}`} · {minutesSince(order.openedAt, now)} min
                {!mine && ` · ${order.openedBy.name}`}
            </span>
            <span className="order-card__meta">
                {progress.dishCount === 0 ? 'No dishes yet' : `${progress.dishCount} ${progress.dishCount === 1 ? 'dish' : 'dishes'}`}
            </span>
            <KitchenProgress order={progress} now={now} doneText={takeout ? 'Ready for pickup' : 'All served'} />
            {progress.cameBack > 0 && <span className="order-card__came-back">{progress.cameBack} came back</span>}
        </Link>
    )
}

export default OrderCard
