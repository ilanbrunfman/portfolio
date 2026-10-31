import { useState } from 'react'
import Input from '@/components/ui/form/input/Input'
import Textarea from '@/components/ui/form/textarea/Textarea'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import Button from '@/components/ui/button/Button'
import { centsToInput, parseMoney } from '@/pages/taim/utils/money'
import { ALLERGENS } from '@/pages/taim/utils/allergens'

/**
 * Add or edit a dish. Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {object|null} props.dish            The dish to edit, or null to add one.
 * @param {object[]} props.categories          [{ id, name }] to pick from.
 * @param {number} [props.categoryId]          Pre-picked category for a new dish.
 * @param {(data: object) => Promise} props.onSave   Create/update; throws with err.fields on failure.
 * @param {() => Promise} [props.onDelete]   Remove the dish (from the draft); asks once first.
 * @param {() => void} props.onDone            Called after saving, and on Cancel.
 */
const DishForm = ({ dish, categories, categoryId, onSave, onDelete, onDone }) => {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [name, setName] = useState(dish?.name ?? '')
    const [category, setCategory] = useState(String(dish?.categoryId ?? categoryId ?? categories[0]?.id ?? ''))
    const [price, setPrice] = useState(dish ? centsToInput(dish.price) : '')
    const [prep, setPrep] = useState(dish?.prepMinutes ? String(dish.prepMinutes) : '')
    const [description, setDescription] = useState(dish?.description ?? '')
    const [onMenu, setOnMenu] = useState(dish ? !dish.hidden : true)
    const [allergens, setAllergens] = useState(dish?.allergens ?? [])
    const toggleAllergen = (value) =>
        setAllergens((list) => (list.includes(value) ? list.filter((v) => v !== value) : ALLERGENS.map((a) => a.value).filter((v) => v === value || list.includes(v))))
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)

    // Clear a field's error as soon as the user edits it
    const clearError = (field) =>
        setErrors((prev) => {
            const next = { ...prev }
            delete next[field]
            return next
        })

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Quick checks in the browser; the server validates again either way
        const cents = parseMoney(price)
        const found = {}
        if (!name.trim()) found.name = 'Name is required'
        if (cents === null) found.price = 'Enter a price like 14 or 14.50'
        else if (cents <= 0) found.price = 'Price must be more than 0'
        // Prep time is optional: empty = not set
        const prepMinutes = prep.trim() === '' ? null : Number(prep)
        if (prepMinutes !== null && (!Number.isInteger(prepMinutes) || prepMinutes < 1 || prepMinutes > 180)) {
            found.prepMinutes = 'Enter whole minutes, 1 to 180'
        }
        if (Object.keys(found).length > 0) return setErrors(found)

        setSaving(true)
        try {
            await onSave({
                categoryId: Number(category),
                name: name.trim(),
                price: cents,
                prepMinutes,
                description: description.trim() || null,
                hidden: !onMenu,
                allergens,
            })
            onDone()
        } catch (err) {
            // Server validation → under the matching inputs; anything else on top
            const { _: general, ...fields } = err.fields ?? {}
            setErrors({ ...fields, form: Object.keys(fields).length ? general : (general ?? err.message) })
            setSaving(false)
        }
    }

    const remove = async () => {
        setSaving(true)
        try {
            await onDelete()
            onDone()
        } catch (err) {
            setErrors({ form: err.message })
            setSaving(false)
            setConfirmDelete(false)
        }
    }

    return (
        <form className="d-flex flex-column gap-1" onSubmit={handleSubmit} noValidate>
            {errors.form && <p className="form__error" role="alert">{errors.form}</p>}

            <Input
                label="Name"
                value={name}
                onChange={(e) => { setName(e.target.value); clearError('name') }}
                error={errors.name}
                maxLength={60}
                autoComplete="off"
                placeholder="e.g. Shakshuka"
            />

            <RadioGroup
                label="Category"
                options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                value={category}
                onChange={(value) => { setCategory(value); clearError('categoryId') }}
                direction="row"
            />
            {errors.categoryId && <p className="form__error" role="alert">{errors.categoryId}</p>}

            <Input
                label="Price"
                value={price}
                onChange={(e) => { setPrice(e.target.value); clearError('price') }}
                error={errors.price}
                inputMode="decimal"
                autoComplete="off"
                placeholder="14.00"
            />

            <Input
                label="Prep time (minutes)"
                hint="Optional. How long the kitchen should take; the Kitchen screen shows dishes running late."
                value={prep}
                onChange={(e) => { setPrep(e.target.value); clearError('prepMinutes') }}
                error={errors.prepMinutes}
                type="number"
                inputMode="numeric"
                min={1}
                max={180}
                placeholder="e.g. 12"
            />

            <Textarea
                label="Description"
                hint="Optional. A few words the waiter can read to guests."
                value={description}
                onChange={(e) => { setDescription(e.target.value); clearError('description') }}
                error={errors.description}
                rows={2}
                maxLength={200}
            />

            <fieldset className="d-flex flex-column gap-0-5">
                <legend className="form__label">Contains (allergens)</legend>
                <span className="form__hint">The waiter is warned when a guest at the seat is allergic to one of them.</span>
                <div className="d-flex flex-wrap gap-1">
                    {ALLERGENS.map((allergen) => (
                        <Checkbox
                            key={allergen.value}
                            label={allergen.label}
                            checked={allergens.includes(allergen.value)}
                            onChange={() => toggleAllergen(allergen.value)}
                        />
                    ))}
                </div>
            </fieldset>

            <Checkbox
                label="On the menu (untick when it's sold out)"
                checked={onMenu}
                onChange={(e) => setOnMenu(e.target.checked)}
            />

            <div className="d-flex flex-wrap justify-end gap-0-5">
                {dish && onDelete && (
                    <Button variant="secondary" className="mr-auto" onClick={confirmDelete ? remove : () => setConfirmDelete(true)} disabled={saving}>
                        {confirmDelete ? `Yes, remove ${dish.name}` : 'Remove dish'}
                    </Button>
                )}
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : dish ? 'Save dish' : 'Add dish'}</Button>
            </div>
        </form>
    )
}

export default DishForm
