import { useState } from 'react'
import Input from '@/components/ui/form/input/Input'
import Button from '@/components/ui/button/Button'

/**
 * Add or rename a menu category; an empty one can also be deleted.
 * Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {object|null} props.category         The category to edit ({ id, name, items }), or null to add one.
 * @param {(name: string) => Promise} props.onSave   Create/rename; throws with err.fields on failure.
 * @param {() => Promise} [props.onDelete]      Delete (only offered when the category has no dishes).
 * @param {() => void} props.onDone             Called after saving/deleting, and on Cancel.
 */
const CategoryForm = ({ category, onSave, onDelete, onDone }) => {
    const [name, setName] = useState(category?.name ?? '')
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const canDelete = Boolean(category && onDelete && category.items.length === 0)

    const run = async (action) => {
        setSaving(true)
        try {
            await action()
            onDone()
        } catch (err) {
            const { _: general, ...fields } = err.fields ?? {}
            setErrors({ ...fields, form: Object.keys(fields).length ? general : (general ?? err.message) })
            setSaving(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!name.trim()) return setErrors({ name: 'Name is required' })
        run(() => onSave(name.trim()))
    }

    return (
        <form className="d-flex flex-column gap-1" onSubmit={handleSubmit} noValidate>
            {errors.form && <p className="form__error" role="alert">{errors.form}</p>}

            <Input
                label="Name"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors({}) }}
                error={errors.name}
                maxLength={40}
                autoComplete="off"
                placeholder="e.g. Desserts"
            />

            {category && !canDelete && (
                <p className="form__hint">A category can only be deleted when it has no dishes.</p>
            )}

            <div className="d-flex flex-wrap justify-end gap-0-5">
                {canDelete && (
                    <Button variant="secondary" className="mr-auto" onClick={() => run(onDelete)} disabled={saving}>
                        Delete category
                    </Button>
                )}
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : category ? 'Save' : 'Add category'}</Button>
            </div>
        </form>
    )
}

export default CategoryForm
