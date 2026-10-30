import { useState } from 'react'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import './DishDetails.scss'

const MAX_QUANTITY = 10

/** "Seat 2", "Seats 1, 2 and 4", "the table" */
function forText(picked) {
    if (picked.includes('shared')) return 'the table'
    if (picked.length === 1) return `Seat ${picked[0]}`
    return `Seats ${picked.slice(0, -1).join(', ')} and ${picked.at(-1)}`
}

/**
 * A dish's details, so the waiter can describe it to the guest, and adding
 * it to the bill: for which seats (at a table) and how many. Seats are
 * checkboxes – one dish each, e.g. a hummus for seats 1 and 3 – while
 * Shared (for the whole table) is a radio: picking it clears the seats, and
 * ticking a seat clears Shared. "How many" is per seat. Meant to sit inside
 * a <Modal>. A sold-out dish can still be read about, not added.
 *
 * @param {object} props
 * @param {object} props.dish                          { name, price, description, hidden }
 * @param {{ value: string, label: string }[]} props.seats  Seat choices, Shared last ([] for a take-out).
 * @param {string} [props.seat]                         The pre-picked seat value ('1' … 'shared').
 * @param {({ seats: string[], quantity: number, toGo: boolean }) => Promise} props.onAdd  seats = ['1', '3'] or ['shared'] ([] on a take-out); toGo = the guests take it home. Throws on failure.
 * @param {() => void} props.onDone                     Called after adding, and on Close.
 */
const DishDetails = ({ dish, seats, seat: initialSeat = seats[0]?.value ?? 'shared', onAdd, onDone }) => {
    const [picked, setPicked] = useState(seats.length > 0 ? [initialSeat] : [])
    const [quantity, setQuantity] = useState(1)
    const [toGo, setToGo] = useState(false)
    const [error, setError] = useState('')
    const [adding, setAdding] = useState(false)
    const seatChoices = seats.filter((option) => option.value !== 'shared')
    const hasShared = seats.some((option) => option.value === 'shared')
    const atTable = seats.length > 0
    // One dish per seat (Shared or a take-out: one)
    const count = quantity * Math.max(1, picked.length)

    /** Tick / untick a seat (in seat order); Shared goes */
    const toggleSeat = (value) => {
        setError('')
        setPicked((current) => {
            const seatsOnly = current.filter((v) => v !== 'shared')
            const next = seatsOnly.includes(value) ? seatsOnly.filter((v) => v !== value) : [...seatsOnly, value]
            return next.sort((a, b) => Number(a) - Number(b))
        })
    }

    const add = async () => {
        if (atTable && picked.length === 0) return setError('Pick the seats, or Shared')
        setAdding(true)
        setError('')
        try {
            await onAdd({ seats: picked, quantity, toGo: atTable && toGo })
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
                    {atTable && (
                        <fieldset className="dish-details__for d-flex flex-column gap-0-5">
                            <legend className="form__label">For</legend>
                            <div className="d-flex flex-wrap align-items-center gap-1">
                                {seatChoices.map((option) => (
                                    <Checkbox
                                        key={option.value}
                                        label={option.label}
                                        checked={picked.includes(option.value)}
                                        onChange={() => toggleSeat(option.value)}
                                    />
                                ))}
                                {hasShared && (
                                    <RadioGroup
                                        className="dish-details__shared"
                                        options={[{ value: 'shared', label: 'Shared' }]}
                                        value={picked.includes('shared') ? 'shared' : ''}
                                        onChange={() => { setError(''); setPicked(['shared']) }}
                                        direction="row"
                                    />
                                )}
                            </div>
                        </fieldset>
                    )}

                    {atTable && (
                        <Checkbox
                            className="dish-details__to-go-choice"
                            label="To go: the guests take it home (packed, same bill)"
                            checked={toGo}
                            onChange={(e) => setToGo(e.target.checked)}
                        />
                    )}

                    <div className="d-flex align-items-center gap-1">
                        <span className="form__label" id="dish-quantity-label">{picked.length > 1 ? 'How many each' : 'How many'}</span>
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
                    <Button onClick={add} disabled={adding || (atTable && picked.length === 0)}>
                        {adding
                            ? 'Adding…'
                            : `Add ${count > 1 ? `${count} · ` : ''}${formatMoney(dish.price * count)}${atTable && picked.length > 0 ? ` for ${forText(picked)}` : ''}${atTable && toGo ? ' · to go' : ''}`}
                    </Button>
                )}
            </div>
        </div>
    )
}

export default DishDetails
