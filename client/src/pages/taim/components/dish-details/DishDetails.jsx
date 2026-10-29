import { useState } from 'react'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import './DishDetails.scss'

const MAX_QUANTITY = 10

/**
 * A dish's details, so the waiter can describe it to the guest, and adding
 * it to the bill: for which seat (at a table) and how many. Meant to sit
 * inside a <Modal>. A sold-out dish can still be read about, not added.
 *
 * @param {object} props
 * @param {object} props.dish                          { name, price, description, hidden }
 * @param {{ value: string, label: string }[]} props.seats  Seat choices ([] for a take-out).
 * @param {string} [props.seat]                         The pre-picked seat value ('1' … 'shared').
 * @param {({ seat: string, quantity: number }) => Promise} props.onAdd  Throws on failure.
 * @param {() => void} props.onDone                     Called after adding, and on Close.
 */
const DishDetails = ({ dish, seats, seat: initialSeat = seats[0]?.value ?? 'shared', onAdd, onDone }) => {
    const [seat, setSeat] = useState(initialSeat)
    const [quantity, setQuantity] = useState(1)
    const [error, setError] = useState('')
    const [adding, setAdding] = useState(false)
    const forLabel = seats.find((option) => option.value === seat)?.label

    const add = async () => {
        setAdding(true)
        setError('')
        try {
            await onAdd({ seat, quantity })
            onDone()
        } catch (err) {
            setError(err.message)
            setAdding(false)
        }
    }

    return (
        <div className="dish-details d-flex flex-column gap-1">
            <div className="d-flex justify-between align-items-baseline gap-1">
                <span className="dish-details__price">{formatMoney(dish.price)}</span>
                {dish.hidden && <span className="dish-details__sold-out">Sold out</span>}
            </div>
            <p className={dish.description ? 'dish-details__description' : 'form__hint'}>
                {dish.description ?? 'No description yet. The Chef can add one in the Menu.'}
            </p>

            {error && <p className="form__error" role="alert">{error}</p>}

            {!dish.hidden && (
                <>
                    {seats.length > 0 && (
                        <RadioGroup label="For" options={seats} value={seat} onChange={setSeat} direction="row" />
                    )}

                    <div className="d-flex align-items-center gap-1">
                        <span className="form__label" id="dish-quantity-label">How many</span>
                        <div className="dish-details__stepper d-flex align-items-center" role="group" aria-labelledby="dish-quantity-label">
                            <button type="button" onClick={() => setQuantity((n) => n - 1)} disabled={quantity <= 1} aria-label="One less">−</button>
                            <output aria-live="polite">{quantity}</output>
                            <button type="button" onClick={() => setQuantity((n) => n + 1)} disabled={quantity >= MAX_QUANTITY} aria-label="One more">+</button>
                        </div>
                    </div>
                </>
            )}

            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onDone} disabled={adding}>Close</Button>
                {!dish.hidden && (
                    <Button onClick={add} disabled={adding}>
                        {adding
                            ? 'Adding…'
                            : `Add ${quantity > 1 ? `${quantity} · ` : ''}${formatMoney(dish.price * quantity)}${forLabel ? ` for ${forLabel.toLowerCase() === 'shared' ? 'the table' : forLabel}` : ''}`}
                    </Button>
                )}
            </div>
        </div>
    )
}

export default DishDetails
