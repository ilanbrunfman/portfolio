import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { useOrder } from '@/pages/taim/hooks/useOrder'
import { useMenu } from '@/pages/taim/hooks/useMenu'
import Ticket from '@/pages/taim/components/ticket/Ticket'
import SeatingActions from '@/pages/taim/components/seating-actions/SeatingActions'
import DishDetails from '@/pages/taim/components/dish-details/DishDetails'
import BillItemEditor from '@/pages/taim/components/bill-item-editor/BillItemEditor'
import SendDialog from '@/pages/taim/components/send-dialog/SendDialog'
import Modal from '@/components/ui/modal/Modal'
import { seatOptions, seatFromValue } from '@/pages/taim/utils/orders'
import Tabs from '@/components/ui/tabs/Tabs'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import './Order.scss'

/**
 * /taim/order/:orderId – take an order, like a POS terminal: the menu by
 * category (in the Chef's order) on one side, the bill on the other.
 * A tap on a dish opens its details (description, so the waiter can
 * describe it) with "For" (seat), "How many" and Add. At a table the seat
 * picked above the menu is the default; Shared is for the whole table.
 * Added dishes wait on the bill as "Not sent" until "Send to kitchen";
 * more rounds can follow (desserts). "Send to kitchen" opens a popup that
 * asks which go now: the rest are put on hold (starters now, mains later)
 * until "Fire held" on the bill. Unticking everything holds them all
 * (the starter went earlier, the mains added now should wait). A tap on a dish on the bill opens its
 * editor: another seat (any time), or remove (until the kitchen sends it
 * out). Closing the bill is a separate, smaller button at the end.
 */
const OrderPage = () => {
    const orderId = Number(useParams().orderId)
    const navigate = useNavigate()
    const { can, canEditDishes } = useStaff()
    const { order, error, addDish, moveDish, removeDish, send, hold, close, update, undo } = useOrder(orderId)
    const menu = useMenu()
    const [category, setCategory] = useState(null) // null = the first one
    const [seat, setSeat] = useState('1') // '1', '2'… or 'shared'
    const [details, setDetails] = useState(null) // the dish whose details are open
    const [editing, setEditing] = useState(null) // the bill line being edited
    const [choosing, setChoosing] = useState(false) // the send dialog is open
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
    // Waiter/Manager on any order; the Host on take-outs only (read-only bill on a table)
    const canEdit = canEditDishes(order.type)
    const atTable = order.type === 'TABLE'
    // The picked seat, unless guests were reduced below it
    const seatValue = atTable && seat !== 'shared' && Number(seat) > order.guests ? '1' : seat
    const seats = seatOptions(order)

    // From the details popup; errors are shown there
    const handleAdd = async (dish, { seats: values, quantity }) => {
        const forSeats = atTable ? values.map(seatFromValue) : [null]
        try {
            await addDish(dish.id, forSeats, quantity)
        } catch (err) {
            menu.reload() // e.g. it was just marked sold out
            throw err
        }
        if (atTable && values.length === 1) setSeat(values[0]) // the next dish defaults to the same guest
        const count = quantity * forSeats.length
        const who = !atTable ? '' : forSeats[0] === null ? ' for the table' : forSeats.length === 1 ? ` for seat ${forSeats[0]}` : ` for seats ${forSeats.slice(0, -1).join(', ')} and ${forSeats.at(-1)}`
        setMessage(`Added ${count > 1 ? `${count} × ` : ''}${dish.name}${who} – not sent yet`)
    }

    const waiting = order.items.filter((item) => item.status === 'NEW')
    const fresh = waiting.filter((item) => !item.held) // added since the last send
    const sentMessage = (count, held) =>
        `Sent ${count} ${count === 1 ? 'dish' : 'dishes'} to the kitchen${held > 0 ? ` · ${held} on hold` : ''}`

    // Always ask: which go now, which wait on hold
    const handleSend = () => setChoosing(true)

    const handlePick = async (itemIds) => {
        await send(itemIds)
        setMessage(sentMessage(itemIds.length, waiting.length - itemIds.length))
    }

    const handleHold = async () => {
        await hold()
        setMessage(`${fresh.length} ${fresh.length === 1 ? 'dish' : 'dishes'} on hold: tap "Fire held" when the table is ready`)
    }

    // Everything waiting goes: the held dishes and any added since
    const handleFire = async () => {
        await send()
        setMessage(`Fired ${waiting.length} ${waiting.length === 1 ? 'dish' : 'dishes'}: the kitchen has them now`)
    }

    return (
        <div className="order-page d-flex flex-column gap-1">
            <div className="d-flex flex-wrap align-items-start justify-between gap-1">
                <Button variant="ghost" size="sm" icon="IconArrowLeft" to="/taim/floor">Floor</Button>
                {isOpen && can('seatTable') && (
                    <SeatingActions
                        order={order}
                        onUpdate={update}
                        onUndo={async () => { await undo(); navigate('/taim/floor') }}
                    />
                )}
            </div>

            <div className="order-page__layout d-flex flex-wrap align-items-start gap-2">
                {isOpen && canEdit && (
                    <section className="order-page__menu d-flex flex-column gap-1" aria-label="Menu">
                        {atTable && (
                            <RadioGroup
                                label="For"
                                options={seats}
                                value={seatValue}
                                onChange={setSeat}
                                direction="row"
                                className="order-page__seats"
                            />
                        )}
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
                                                    className={`order-page__dish d-flex flex-column justify-between gap-0-5 ${dish.hidden ? 'is-sold-out' : ''}`}
                                                    onClick={() => setDetails(dish)}
                                                    aria-label={`${dish.name}, ${dish.hidden ? 'sold out' : formatMoney(dish.price)}. Details`}
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
                    onEditItem={canEdit ? setEditing : undefined}
                    onSend={canEdit ? handleSend : undefined}
                    onFire={canEdit ? handleFire : undefined}
                    onClose={can('closeBill') ? async () => { await close(); navigate('/taim/floor') } : undefined}
                />
            </div>

            <Modal isOpen={Boolean(details)} onClose={() => setDetails(null)} title={details?.name} size="sm">
                {details && (
                    <DishDetails
                        dish={details}
                        seats={seats}
                        seat={seatValue}
                        onAdd={(choice) => handleAdd(details, choice)}
                        onDone={() => setDetails(null)}
                    />
                )}
            </Modal>

            <Modal isOpen={choosing} onClose={() => setChoosing(false)} title="Send to kitchen" size="sm">
                {choosing && (
                    <SendDialog items={waiting} atTable={atTable} onSend={handlePick} onHold={handleHold} onDone={() => setChoosing(false)} />
                )}
            </Modal>

            <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.name} size="sm">
                {editing && (
                    <BillItemEditor
                        item={editing}
                        seats={seats}
                        onMove={(value) => moveDish(editing.id, seatFromValue(value))}
                        onRemove={() => removeDish(editing.id)}
                        onDone={() => setEditing(null)}
                    />
                )}
            </Modal>
        </div>
    )
}

export default OrderPage
