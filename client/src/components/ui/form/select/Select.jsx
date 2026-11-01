import { useId } from 'react'
import Field from '@/components/ui/form/field/Field'
import { fieldAria } from '@/components/ui/form/field/fieldAria'
import Icon from '@/components/ui/icon/Icon'
import './Select.scss'

/**
 * A dropdown: one choice from a list. A native <select>, so it works with
 * the keyboard, screen readers and the phone's own picker; styled like
 * Input, with a chevron.
 *
 * @param {object} props
 * @param {string} [props.id]                   Select id (auto-generated if omitted).
 * @param {React.ReactNode} [props.label]
 * @param {React.ReactNode} [props.hint]
 * @param {React.ReactNode} [props.error]
 * @param {{ value: string, label: string }[]} props.options
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange  Gets the picked value (like RadioGroup).
 * @param {string} [props.placeholder]          A first, empty choice ("Pick a reason…"); value ''.
 * @param {string} [props.className]            Extra classes on the <select>.
 * @param {string} [props.fieldClassName]       Extra classes on the field wrapper.
 * Any other props (disabled, name, …) go to the <select>.
 */
const Select = ({ id, label, hint, error, options, value, onChange, placeholder, className = '', fieldClassName = '', ...props }) => {
    const autoId = useId()
    const selectId = id ?? autoId

    return (
        <Field id={selectId} label={label} hint={hint} error={error} className={fieldClassName}>
            <span className="select">
                <select
                    {...props}
                    id={selectId}
                    className={`form__input select__control ${value === '' ? 'is-empty' : ''} ${className}`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    {...fieldAria(selectId, { hint, error })}
                >
                    {placeholder !== undefined && <option value="">{placeholder}</option>}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <Icon name="IconCaretRight" size={14} className="select__chevron" aria-hidden="true" />
            </span>
        </Field>
    )
}

export default Select
