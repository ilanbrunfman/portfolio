import { useState } from 'react'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { useOrders } from '@/pages/taim/hooks/useOrders'
import { useNow } from '@/pages/taim/hooks/useNow'
import OrderCard from '@/pages/taim/components/order-card/OrderCard'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import { kitchenProgress } from '@/pages/taim/utils/orders'
import './Order.scss'

const SHOW = [
    { value: 'MINE', label: 'Mine' },
    { value: 'ALL', label: 'All' },
]

/**
 * /taim/order – the open orders, as cards like the Floor's (OrderCard): the
 * table or take-out, guests, minutes, dishes, the bill so far and how the
 * food is coming along. "Mine" (orders I opened; the default for a waiter)
 * or "All". Live: reloads every 5 seconds. New orders start on the Floor.
 */
const OrderList = () => {
    const { session } = useStaff()
    const { orders, error, reload } = useOrders()
    const now = useNow(15_000)
    const [show, setShow] = useState(session.staff.role === 'WAITER' ? 'MINE' : 'ALL')

    if (error && !orders) {
        return (
            <div className="taim__notice surface d-flex flex-column gap-1 align-items-start" role="alert">
                <p>Couldn't load orders: {error}</p>
                <Button variant="secondary" onClick={reload}>Try again</Button>
            </div>
        )
    }
    if (!orders) return <p role="status">Loading orders…</p>

    const mine = (order) => order.openedBy.id === session.staff.id
    const shown = show === 'MINE' ? orders.filter(mine) : orders
    const toSend = shown.reduce((sum, order) => sum + kitchenProgress(order.items).notSent, 0)
    const total = shown.reduce((sum, order) => sum + order.total, 0)

    return (
        <div className="order-list d-flex flex-column gap-2">
            <div className="d-flex flex-wrap align-items-center justify-between gap-1">
                <div className="d-flex flex-column">
                    <h2 className="taim__heading">Orders</h2>
                    <span className="form__hint">
                        {shown.length} open{show === 'MINE' ? ' of yours' : ''} · {formatMoney(total)} on the bills
                        {toSend > 0 && ` · ${toSend} ${toSend === 1 ? 'dish' : 'dishes'} not sent`}
                    </span>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-1">
                    <RadioGroup label="Show" options={SHOW} value={show} onChange={setShow} direction="row" className="order-list__show" />
                    <Button variant="secondary" to="/taim/floor">Floor</Button>
                </div>
            </div>

            {error && <p className="form__error" role="alert">Couldn't refresh: {error}</p>}

            {shown.length === 0 ? (
                <div className="surface d-flex flex-wrap align-items-center justify-between gap-1">
                    <p className="form__hint">
                        {show === 'MINE' && orders.length > 0
                            ? `None of the ${orders.length} open orders are yours.`
                            : 'No open orders. Seat a table on the Floor to start one.'}
                    </p>
                    {show === 'MINE' && orders.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setShow('ALL')}>Show all</Button>
                    )}
                </div>
            ) : (
                <ul className="order-list__items" aria-label="Open orders">
                    {shown.map((order) => (
                        <li key={order.id}>
                            <OrderCard order={order} now={now} mine={mine(order)} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default OrderList
