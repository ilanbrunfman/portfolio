import { useMemo, useState } from 'react'
import { useBank } from '@/pages/bank/context/BankContext'
import Input from '@/components/ui/form/input/Input'
import Combobox from '@/components/ui/form/combobox/Combobox'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Button from '@/components/ui/button/Button'
import { centsToInput, parseMoney } from '@/pages/bank/utils/money'
import { today } from '@/pages/bank/utils/date'

const KINDS = [
    { value: 'EXPENSE', label: 'Expense' },
    { value: 'INCOME', label: 'Income' },
]

/**
 * Add, edit or delete a transaction. Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {object} props.account              The account it belongs to.
 * @param {object|null} props.transaction     The transaction to edit, or null to add one.
 * @param {object[]} [props.recent]           Recent transactions, newest first – used for
 *                                            description suggestions and their usual category.
 * @param {(changed: boolean) => void} props.onDone  After save/delete (true) or Cancel (false).
 */
const TransactionForm = ({ account, transaction, recent = [], onDone }) => {
    const { categories, createTransaction, updateTransaction, deleteTransaction } = useBank()
    const isEdit = Boolean(transaction)
    const isTransfer = Boolean(transaction?.transferId)

    const [kind, setKind] = useState(transaction && transaction.amount > 0 ? 'INCOME' : 'EXPENSE')
    const [amount, setAmount] = useState(transaction ? centsToInput(Math.abs(transaction.amount)) : '')
    const [date, setDate] = useState(transaction?.date ?? today())
    const [description, setDescription] = useState(transaction?.description ?? '')
    const [category, setCategory] = useState(transaction?.category?.name ?? '')
    const [note, setNote] = useState(transaction?.note ?? '')
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    // description → the category it had most recently (first one wins: newest first)
    const usual = useMemo(() => {
        const map = new Map()
        for (const t of recent) if (!t.transferId && !map.has(t.description)) map.set(t.description, t.category)
        return map
    }, [recent])

    const kindCategories = categories.filter((c) => c.kind === kind)
    const findCategory = (name) => kindCategories.find((c) => c.name.toLowerCase() === name.trim().toLowerCase())

    const clearError = (field) =>
        setErrors((prev) => {
            const next = { ...prev }
            delete next[field]
            return next
        })

    const handleKind = (value) => {
        setKind(value)
        // A category of the other kind no longer fits
        if (category && !categories.some((c) => c.kind === value && c.name === category)) setCategory('')
        clearError('category')
    }

    const handleDescription = (value) => {
        setDescription(value)
        clearError('description')
        // Picked a known description → fill in its usual category (if none chosen yet)
        const previous = usual.get(value)
        if (previous && !category) {
            setKind(previous.kind)
            setCategory(previous.name)
        }
    }

    // Server errors → under the matching input; the rest on top of the form
    const showServerError = (err) => {
        const { categoryId, accountId, _: general, ...fields } = err.fields ?? {}
        setErrors({
            ...fields,
            ...(categoryId && { category: categoryId }),
            form: accountId ?? general ?? (Object.keys(fields).length || categoryId ? undefined : err.message),
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const cents = parseMoney(amount)
        const picked = category.trim() ? findCategory(category) : null

        const found = {}
        if (cents === null || cents === 0) found.amount = 'Enter an amount like 25 or 25.50'
        if (!date) found.date = 'Pick a date'
        if (!description.trim()) found.description = 'Description is required'
        if (category.trim() && !picked) found.category = 'Pick a category from the list'
        if (Object.keys(found).length > 0) return setErrors(found)

        const data = {
            date,
            amount: kind === 'EXPENSE' ? -Math.abs(cents) : Math.abs(cents),
            description: description.trim(),
            categoryId: picked?.id ?? null,
            note: note.trim() || null,
        }

        setSaving(true)
        try {
            if (isEdit) await updateTransaction(transaction, data)
            else await createTransaction({ accountId: account.id, ...data })
            onDone(true)
        } catch (err) {
            showServerError(err)
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setSaving(true)
        try {
            await deleteTransaction(transaction)
            onDone(true)
        } catch (err) {
            setErrors({ form: err.message })
            setSaving(false)
            setConfirmDelete(false)
        }
    }

    const deleteControls = confirmDelete ? (
        <div className="form__actions align-items-center" role="group" aria-label="Confirm delete">
            <span className="mr-auto">
                {isTransfer ? 'Delete both sides of this transfer?' : 'Delete this transaction?'}
            </span>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={saving}>Keep it</Button>
            <Button onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</Button>
        </div>
    ) : null

    // Transfers can only be deleted for now (editing both sides comes later)
    if (isTransfer) {
        return (
            <div className="d-flex flex-column gap-1">
                {errors.form && <p className="form__error" role="alert">{errors.form}</p>}
                <p>
                    <strong>{transaction.description}</strong> is one side of a transfer between two accounts.
                    Transfers can't be edited yet; delete it to remove both sides.
                </p>
                {deleteControls ?? (
                    <div className="form__actions">
                        <Button variant="secondary" icon="IconTrash" onClick={() => setConfirmDelete(true)} className="mr-auto">
                            Delete transfer
                        </Button>
                        <Button variant="ghost" onClick={() => onDone(false)}>Close</Button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <form className="d-flex flex-column gap-1" onSubmit={handleSubmit} noValidate>
            {errors.form && <p className="form__error" role="alert">{errors.form}</p>}

            <RadioGroup label="Type" options={KINDS} value={kind} onChange={handleKind} direction="row" />

            <div className="d-grid grid-1 grid-sm-2 gap-1">
                <Input
                    label="Amount"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); clearError('amount') }}
                    error={errors.amount}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                />
                <Input
                    label="Date"
                    type="date"
                    value={date}
                    onChange={(e) => { setDate(e.target.value); clearError('date') }}
                    error={errors.date}
                />
            </div>

            <Combobox
                label="Description"
                value={description}
                onChange={handleDescription}
                options={[...usual.keys()]}
                error={errors.description}
                placeholder="e.g. Groceries at Costco"
                maxLength={120}
            />

            <Combobox
                label="Category"
                hint="Optional"
                value={category}
                onChange={(value) => { setCategory(value); clearError('category') }}
                options={kindCategories.map((c) => c.name)}
                error={errors.category}
                toggleLabel="Show categories"
            />

            <Input
                label="Note"
                hint="Optional"
                value={note}
                onChange={(e) => { setNote(e.target.value); clearError('note') }}
                error={errors.note}
                maxLength={500}
                autoComplete="off"
            />

            {deleteControls ?? (
                <div className="form__actions">
                    {isEdit && (
                        <Button variant="secondary" icon="IconTrash" onClick={() => setConfirmDelete(true)} disabled={saving} className="mr-auto">
                            Delete
                        </Button>
                    )}
                    <Button variant="ghost" onClick={() => onDone(false)} disabled={saving}>Cancel</Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add transaction'}
                    </Button>
                </div>
            )}
        </form>
    )
}

export default TransactionForm
