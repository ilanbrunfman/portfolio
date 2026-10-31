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
import AllergyForm from '@/pages/taim/components/allergy-form/AllergyForm'
import Modal from '@/components/ui/modal/Modal'
import { seatOptions, seatFromValue } from '@/pages/taim/utils/orders'
import Tabs from '@/components/ui/tabs/Tabs'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import { allergenText, allergyWho, allergyWhat, clashOf } from '@/pages/taim/utils/allergens'
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
 * Step 5.4: "Allergies" notes a guest's allergy (a seat, or the whole
 * table / take-out); they show in red above the menu, a dish that clashes
 * with the picked seat says so on its button, and adding it asks to confirm.
 */
const OrderPage = () => {
    const orderId = Number(useParams().orderId)
    const navigate = useNavigate()
    const { can, canEditDishes } = useStaff()
    const { order, error, addDish, noteAllergy, updateDish, cameBack, undoCameBack, waste, removeDish, send, hold, close, update, undo } = useOrder(orderId)
    const menu = useMenu()
    const [category, setCategory] = useState(null) // null = the first one
    const [seat, setSeat] = useState('1') // '1', '2'… or 'shared'
    const [details, setDetails] = useState(null) // the dish whose details are open
    const [editing, setEditing] = useState(null) // the bill line being edited
    const [choosing, setChoosing] = useState(false) // the send dialog is open
    const [allergyFor, setAllergyFor] = useState(undefined) // the allergy form: a seat (null = whole), or undefined = closed
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
    // The seat the menu buttons check for clashes (null = shared / take-out)
    const pickedSeat = atTable && seatValue !== 'shared' ? Number(seatValue) : null

    // From the details popup; errors are shown there
    const handleAdd = async (dish, { seats: values, quantity, toGo, allergyConfirmed }) => {
        const forSeats = atTable ? values.map(seatFromValue) : [null]
        try {
            await addDish(dish.id, forSeats, quantity, toGo, allergyConfirmed)
        } catch (err) {
            menu.reload() // e.g. it was just marked sold out
            throw err
        }
        if (atTable && values.length === 1) setSeat(values[0]) // the next dish defaults to the same guest
        const count = quantity * forSeats.length
        const who = !atTable ? '' : forSeats[0] === null ? ' for the table' : forSeats.length === 1 ? ` for seat ${forSeats[0]}` : ` for seats ${forSeats.slice(0, -1).join(', ')} and ${forSeats.at(-1)}`
        setMessage(`Added ${count > 1 ? `${count} × ` : ''}${dish.name}${who}${toGo ? ', to go' : ''} – not sent yet`)
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
                        <div className="order-page__allergies d-flex flex-wrap align-items-center gap-0-5">
                            {order.allergies.map((row) => (
                                <button key={row.seat ?? 'whole'} type="button" className="order-page__allergy" onClick={() => setAllergyFor(row.seat)} aria-label={`Allergy, ${allergyWho(row, order.type)}: ${allergyWhat(row)}. Edit`}>
                                    <strong>{allergyWho(row, order.type)}</strong> {allergyWhat(row)}
                                </button>
                            ))}
                            <Button size="sm" variant="ghost" icon="IconPlus" onClick={() => setAllergyFor(pickedSeat)}>
                                {order.allergies.length > 0 ? 'Allergy' : 'Allergies'}
                            </Button>
                        </div>
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
                                        ?.items.map((dish) => {
                                            // Clashes with an allergy at the picked seat (or anyone's, for Shared)
                                            const clash = clashOf(dish.allergens, order.allergies, pickedSeat)
                                            return (
                                                <li key={dish.id}>
                                                    <button
                                                        type="button"
                                                        className={`order-page__dish d-flex flex-column justify-between gap-0-5 ${dish.hidden ? 'is-sold-out' : ''} ${clash.length ? 'is-clash' : ''}`}
                                                        onClick={() => setDetails(dish)}
                                                        aria-label={`${dish.name}, ${dish.hidden ? 'sold out' : formatMoney(dish.price)}${clash.length ? `, contains ${allergenText(clash)}: allergy` : ''}. Details`}
                                                    >
                                                        <span className="order-page__dish-name">{dish.name}</span>
                                                        {clash.length > 0 && <span className="order-page__dish-clash">Allergy: {allergenText(clash)}</span>}
                                                        <span className="order-page__dish-price">
                                                            {dish.hidden ? 'Sold out' : formatMoney(dish.price)}
                                                        </span>
                                                    </button>
                                                </li>
                                            )
                                        })}
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
                        allergies={order.allergies}
                        seat={seatValue}
                        onAdd={(choice) => handleAdd(details, choice)}
                        onDone={() => setDetails(null)}
                    />
                )}
            </Modal>

            <Modal isOpen={allergyFor !== undefined} onClose={() => setAllergyFor(undefined)} title="Allergies" size="sm">
                {allergyFor !== undefined && (
                    <AllergyForm order={order} seat={allergyFor} onSave={noteAllergy} onDone={() => setAllergyFor(undefined)} />
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
                        allergies={order.allergies}
                        onSave={({ seat: value, toGo, allergyConfirmed }) => updateDish(editing.id, { seat: seatFromValue(value), toGo, allergyConfirmed })}
                        onRemove={() => removeDish(editing.id)}
                        onCameBack={can('markCameBack') ? (data) => cameBack(editing.id, data) : undefined}
                        onUndoCameBack={can('markCameBack') ? () => undoCameBack(editing.id) : undefined}
                        onWaste={(data) => waste(editing.id, data)}
                        menu={menu.categories}
                        onDone={() => setEditing(null)}
                    />
                )}
            </Modal>
        </div>
    )
}

export default OrderPage
