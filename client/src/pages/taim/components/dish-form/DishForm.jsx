import { useState } from 'react'
import Input from '@/components/ui/form/input/Input'
import Textarea from '@/components/ui/form/textarea/Textarea'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import Button from '@/components/ui/button/Button'
import { centsToInput, parseMoney } from '@/pages/taim/utils/money'

/**
 * Add or edit a dish. Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {object|null} props.dish            The dish to edit, or null to add one.
 * @param {object[]} props.categories          [{ id, name }] to pick from.
 * @param {number} [props.categoryId]          Pre-picked category for a new dish.
 * @param {(data: object) => Promise} props.onSave   Create/update; throws with err.fields on failure.
 * @param {() => void} props.onDone            Called after saving, and on Cancel.
 */
const DishForm = ({ dish, categories, categoryId, onSave, onDone }) => {
    const [name, setName] = useState(dish?.name ?? '')
    const [category, setCategory] = useState(String(dish?.categoryId ?? categoryId ?? categories[0]?.id ?? ''))
    const [price, setPrice] = useState(dish ? centsToInput(dish.price) : '')
    const [description, setDescription] = useState(dish?.description ?? '')
    const [onMenu, setOnMenu] = useState(dish ? !dish.hidden : true)
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
        if (Object.keys(found).length > 0) return setErrors(found)

        setSaving(true)
        try {
            await onSave({
                categoryId: Number(category),
                name: name.trim(),
                price: cents,
                description: description.trim() || null,
                hidden: !onMenu,
            })
            onDone()
        } catch (err) {
            // Server validation → under the matching inputs; anything else on top
            const { _: general, ...fields } = err.fields ?? {}
            setErrors({ ...fields, form: Object.keys(fields).length ? general : (general ?? err.message) })
            setSaving(false)
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

            <Textarea
                label="Description"
                hint="Optional. A few words the waiter can read to guests."
                value={description}
                onChange={(e) => { setDescription(e.target.value); clearError('description') }}
                error={errors.description}
                rows={2}
                maxLength={200}
            />

            <Checkbox
                label="On the menu (untick when it's sold out)"
                checked={onMenu}
                onChange={(e) => setOnMenu(e.target.checked)}
            />

            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : dish ? 'Save dish' : 'Add dish'}</Button>
            </div>
        </form>
    )
}

export default DishForm
