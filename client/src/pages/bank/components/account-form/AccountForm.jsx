import { useState } from 'react'
import { useBank } from '@/pages/bank/context/BankContext'
import Input from '@/components/ui/form/input/Input'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Button from '@/components/ui/button/Button'
import { ACCOUNT_TYPES } from '@/pages/bank/data/accountTypes'
import { ACCOUNT_COLORS } from '@/pages/bank/data/accountColors'
import { centsToInput, parseMoney } from '@/pages/bank/utils/money'
import './AccountForm.scss'

/**
 * Create or edit an account. Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {object|null} props.account  The account to edit, or null to create one.
 * @param {() => void} props.onDone    Called after a successful save/archive, and on Cancel.
 */
const AccountForm = ({ account, onDone }) => {
    const { createAccount, updateAccount } = useBank()
    const isEdit = Boolean(account)

    const [name, setName] = useState(account?.name ?? '')
    const [type, setType] = useState(account?.type ?? 'CHECKING')
    const [opening, setOpening] = useState(account ? centsToInput(account.openingBalance) : '0.00')
    const [color, setColor] = useState(account?.color ?? ACCOUNT_COLORS[0])
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
        const openingBalance = parseMoney(opening)
        const found = {}
        if (!name.trim()) found.name = 'Name is required'
        if (openingBalance === null) found.openingBalance = 'Enter an amount like 1250 or 1250.50'
        if (Object.keys(found).length > 0) return setErrors(found)

        setSaving(true)
        try {
            const data = { name: name.trim(), type, openingBalance, color }
            if (isEdit) await updateAccount(account.id, data)
            else await createAccount(data)
            onDone()
        } catch (err) {
            // Server validation → under the matching inputs; anything else on top
            const { _: general, ...fields } = err.fields ?? {}
            setErrors({ ...fields, form: Object.keys(fields).length ? general : (general ?? err.message) })
        } finally {
            setSaving(false)
        }
    }

    const toggleArchived = async () => {
        setSaving(true)
        try {
            await updateAccount(account.id, { archived: !account.archived })
            onDone()
        } catch (err) {
            setErrors({ form: err.message })
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
                placeholder="e.g. Everyday Checking"
            />

            <RadioGroup
                label="Type"
                options={ACCOUNT_TYPES}
                value={type}
                onChange={(value) => { setType(value); clearError('type') }}
                direction="row"
            />

            <Input
                label="Opening balance"
                hint="Money in the account before the first transaction. Use a minus for card debt."
                value={opening}
                onChange={(e) => { setOpening(e.target.value); clearError('openingBalance') }}
                error={errors.openingBalance}
                inputMode="decimal"
                autoComplete="off"
            />

            <fieldset className="account-form__colors d-flex flex-column gap-0-5">
                <legend className="form__label">Color</legend>
                <div className="d-flex flex-wrap gap-0-5">
                    {ACCOUNT_COLORS.map((swatch) => (
                        <label key={swatch} className="account-form__swatch" style={{ '--swatch': swatch }}>
                            <input
                                type="radio"
                                name="account-color"
                                value={swatch}
                                checked={color === swatch}
                                onChange={() => setColor(swatch)}
                                aria-label={swatch}
                            />
                        </label>
                    ))}
                </div>
            </fieldset>

            <div className="form__actions">
                {isEdit && (
                    <Button variant="secondary" onClick={toggleArchived} disabled={saving} className="account-form__archive">
                        {account.archived ? 'Restore account' : 'Archive account'}
                    </Button>
                )}
                <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add account'}
                </Button>
            </div>
        </form>
    )
}

export default AccountForm
