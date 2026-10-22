import { useEffect, useState } from 'react'
import { useBank } from '@/pages/bank/context/BankContext'
import { api } from '@/pages/bank/api/client'
import Input from '@/components/ui/form/input/Input'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Button from '@/components/ui/button/Button'
import { centsToInput, formatMoney, parseMoney } from '@/pages/bank/utils/money'
import { today } from '@/pages/bank/utils/date'

/**
 * Move money between two accounts, or edit/delete an existing transfer.
 * Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {string|null} [props.transferId]   Edit this transfer (loaded from the API), or null to create.
 * @param {number} [props.defaultFromId]     Pre-selected "From" account when creating.
 * @param {(changed: boolean) => void} props.onDone  After save/delete (true) or Cancel (false).
 */
const TransferForm = ({ transferId = null, defaultFromId, onDone }) => {
    const isEdit = Boolean(transferId)
    const [loaded, setLoaded] = useState(isEdit ? null : {})
    const [loadError, setLoadError] = useState(null)

    // Edit mode: fetch the transfer first, then show the form prefilled
    useEffect(() => {
        if (!transferId) return
        let cancelled = false
        api(`/transfers/${transferId}`)
            .then((data) => !cancelled && setLoaded(data))
            .catch((err) => !cancelled && setLoadError(err.message))
        return () => { cancelled = true }
    }, [transferId])

    if (loadError) return <p className="form__error" role="alert">{loadError}</p>
    if (!loaded) return <p>Loading transfer…</p>

    return <TransferFields transfer={isEdit ? loaded : null} defaultFromId={defaultFromId} onDone={onDone} />
}

const TransferFields = ({ transfer, defaultFromId, onDone }) => {
    const { accounts, createTransfer, updateTransfer, deleteTransfer } = useBank()
    const isEdit = Boolean(transfer)

    const [fromId, setFromId] = useState(transfer?.fromAccountId ?? defaultFromId ?? null)
    const [toId, setToId] = useState(transfer?.toAccountId ?? null)
    const [amount, setAmount] = useState(transfer ? centsToInput(transfer.amount) : '')
    const [date, setDate] = useState(transfer?.date ?? today())
    const [description, setDescription] = useState(transfer?.description ?? 'Transfer')
    const [note, setNote] = useState(transfer?.note ?? '')
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    // Active accounts (plus any archived one already in this transfer, so it still shows)
    const choices = accounts.filter((a) => !a.archived || a.id === fromId || a.id === toId)
    const option = (a) => ({
        value: String(a.id),
        label: `${a.name} · ${formatMoney(a.balance)}`,
    })

    const clearError = (field) =>
        setErrors((prev) => {
            const next = { ...prev }
            delete next[field]
            return next
        })

    const handleFrom = (value) => {
        const id = Number(value)
        setFromId(id)
        if (id === toId) setToId(null) // can't send to itself
        clearError('fromAccountId')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const cents = parseMoney(amount)
        const found = {}
        if (!fromId) found.fromAccountId = 'Pick the account the money leaves'
        if (!toId) found.toAccountId = 'Pick the account the money goes to'
        if (cents === null || cents <= 0) found.amount = 'Enter an amount like 250 or 250.50'
        if (!date) found.date = 'Pick a date'
        if (!description.trim()) found.description = 'Description is required'
        if (Object.keys(found).length > 0) return setErrors(found)

        const data = {
            fromAccountId: fromId,
            toAccountId: toId,
            amount: cents,
            date,
            description: description.trim(),
            note: note.trim() || null,
        }
        setSaving(true)
        try {
            if (isEdit) await updateTransfer(transfer.transferId, data)
            else await createTransfer(data)
            onDone(true)
        } catch (err) {
            const { _: general, ...fields } = err.fields ?? {}
            setErrors({ ...fields, form: Object.keys(fields).length ? general : (general ?? err.message) })
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setSaving(true)
        try {
            await deleteTransfer(transfer.transferId)
            onDone(true)
        } catch (err) {
            setErrors({ form: err.message })
            setSaving(false)
            setConfirmDelete(false)
        }
    }

    if (choices.length < 2) {
        return (
            <div className="d-flex flex-column gap-1">
                <p>You need at least two active accounts to make a transfer.</p>
                <div className="form__actions">
                    <Button variant="ghost" onClick={() => onDone(false)}>Close</Button>
                </div>
            </div>
        )
    }

    return (
        <form className="d-flex flex-column gap-1" onSubmit={handleSubmit} noValidate>
            {errors.form && <p className="form__error" role="alert">{errors.form}</p>}

            {/* From and To side by side on wider screens */}
            <div className="d-grid grid-1 grid-sm-2 gap-1">
                <div className="d-flex flex-column gap-0-5">
                    <RadioGroup label="From" options={choices.map(option)} value={String(fromId)} onChange={handleFrom} />
                    {errors.fromAccountId && <p className="form__error" role="alert">{errors.fromAccountId}</p>}
                </div>

                <div className="d-flex flex-column gap-0-5">
                    <RadioGroup
                        label="To"
                        options={choices.map((a) => ({ ...option(a), disabled: a.id === fromId }))}
                        value={String(toId)}
                        onChange={(value) => { setToId(Number(value)); clearError('toAccountId') }}
                    />
                    {errors.toAccountId && <p className="form__error" role="alert">{errors.toAccountId}</p>}
                </div>
            </div>

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

            <Input
                label="Description"
                value={description}
                onChange={(e) => { setDescription(e.target.value); clearError('description') }}
                error={errors.description}
                maxLength={120}
                autoComplete="off"
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

            {confirmDelete ? (
                <div className="form__actions align-items-center" role="group" aria-label="Confirm delete">
                    <span className="mr-auto">Delete both sides of this transfer?</span>
                    <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={saving}>Keep it</Button>
                    <Button onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</Button>
                </div>
            ) : (
                <div className="form__actions">
                    {isEdit && (
                        <Button variant="secondary" icon="IconTrash" onClick={() => setConfirmDelete(true)} disabled={saving} className="mr-auto">
                            Delete
                        </Button>
                    )}
                    <Button variant="ghost" onClick={() => onDone(false)} disabled={saving}>Cancel</Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Transfer'}
                    </Button>
                </div>
            )}
        </form>
    )
}

export default TransferForm
