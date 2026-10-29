import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/pages/taim/api/client'
import { useNow, minutesSince } from '@/pages/taim/hooks/useNow'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import { orderTitle } from '@/pages/taim/utils/orders'
import './Order.scss'

/**
 * /taim/order – pick an open order to work on (tables and take-outs,
 * oldest first). New orders start on the Floor.
 */
const OrderList = () => {
    const now = useNow()
    const [orders, setOrders] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        api('/orders')
            .then((list) => { if (!cancelled) setOrders(list) })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [])

    if (error) return <p className="form__error" role="alert">Couldn't load orders: {error}</p>
    if (!orders) return <p role="status">Loading orders…</p>

    return (
        <div className="order-list d-flex flex-column gap-2">
            <div className="d-flex flex-wrap align-items-center justify-between gap-1">
                <div className="d-flex flex-column">
                    <h2 className="taim__heading">Orders</h2>
                    <span className="form__hint">{orders.length} open · seat a table on the Floor to start a new one</span>
                </div>
                <Button variant="secondary" to="/taim/floor">Floor</Button>
            </div>

            {orders.length === 0 ? (
                <p className="surface">No open orders.</p>
            ) : (
                <ul className="order-list__items">
                    {orders.map((order) => (
                        <li key={order.id}>
                            <Link to={`/taim/order/${order.id}`} className="order-list__item surface d-flex justify-between align-items-center gap-1">
                                <span className="d-flex flex-column">
                                    <strong>{orderTitle(order)}</strong>
                                    <span className="form__hint">
                                        {order.items.length} {order.items.length === 1 ? 'dish' : 'dishes'} · {minutesSince(order.openedAt, now)} min
                                    </span>
                                </span>
                                <span className="order-list__total">{formatMoney(order.total)}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default OrderList
