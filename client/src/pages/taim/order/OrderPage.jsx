import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { useOrder } from '@/pages/taim/hooks/useOrder'
import { useMenu } from '@/pages/taim/hooks/useMenu'
import Ticket from '@/pages/taim/components/ticket/Ticket'
import Tabs from '@/components/ui/tabs/Tabs'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import './Order.scss'

/**
 * /taim/order/:orderId – take an order, like a POS terminal: the menu by
 * category (in the Chef's order) on one side, the bill on the other. A tap
 * on a dish adds it straight away (the kitchen sees it in step 5); a dish
 * added by mistake can be removed while it's still being prepared.
 * Sold-out dishes are shown but can't be tapped.
 */
const OrderPage = () => {
    const orderId = Number(useParams().orderId)
    const navigate = useNavigate()
    const { can } = useStaff()
    const { order, error, addDish, removeDish, close } = useOrder(orderId)
    const menu = useMenu()
    const [category, setCategory] = useState(null) // null = the first one
    const [adding, setAdding] = useState(null) // id of the dish being added
    const [message, setMessage] = useState('')

    if (error && !order) {
        return (
            <div className="taim__notice surface d-flex flex-column gap-1 align-items-start" role="alert">
                <p>{error}</p>
                <Button variant="secondary" to="/taim/order">All orders</Button>
            </div>
        )
    }
    if (!order || !menu.categories) return <p role="status">Loading the order…</p>

    const categories = menu.categories.filter((c) => c.items.length > 0)
    const activeId = category ?? String(categories[0]?.id ?? '')
    const isOpen = order.status === 'OPEN'

    const handleAdd = async (dish) => {
        setAdding(dish.id)
        setMessage('')
        try {
            await addDish(dish.id)
            setMessage(`Added ${dish.name}`)
        } catch (err) {
            setMessage(err.message)
            menu.reload() // e.g. it was just marked sold out
        } finally {
            setAdding(null)
        }
    }

    return (
        <div className="order-page d-flex flex-column gap-1">
            <div>
                <Button variant="ghost" size="sm" icon="IconArrowLeft" to="/taim/floor">Floor</Button>
            </div>

            <div className="order-page__layout d-flex flex-wrap align-items-start gap-2">
                {isOpen && can('addDishes') && (
                    <section className="order-page__menu d-flex flex-column gap-1" aria-label="Menu">
                        <Tabs
                            label="Menu categories"
                            items={categories.map((c) => ({ id: String(c.id), label: c.name }))}
                            value={activeId}
                            onChange={setCategory}
                        >
                            {(id) => (
                                <ul className="order-page__dishes">
                                    {categories
                                        .find((c) => String(c.id) === id)
                                        ?.items.map((dish) => (
                                            <li key={dish.id}>
                                                <button
                                                    type="button"
                                                    className="order-page__dish d-flex flex-column justify-between gap-0-5"
                                                    onClick={() => handleAdd(dish)}
                                                    disabled={dish.hidden || adding === dish.id}
                                                    aria-label={dish.hidden ? `${dish.name}, sold out` : `Add ${dish.name}, ${formatMoney(dish.price)}`}
                                                >
                                                    <span className="order-page__dish-name">{dish.name}</span>
                                                    <span className="order-page__dish-price">
                                                        {dish.hidden ? 'Sold out' : formatMoney(dish.price)}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                </ul>
                            )}
                        </Tabs>
                        <p className="order-page__message form__hint" role="status" aria-live="polite">{message}</p>
                    </section>
                )}

                <Ticket
                    order={order}
                    className="order-page__ticket"
                    onRemove={can('addDishes') ? removeDish : undefined}
                    onClose={can('closeBill') ? async () => { await close(); navigate('/taim/floor') } : undefined}
                />
            </div>
        </div>
    )
}

export default OrderPage
