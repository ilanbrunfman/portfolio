import { useId } from 'react'
import Field from '@/components/ui/form/field/Field'
import { fieldAria } from '@/components/ui/form/field/fieldAria'

/**
 * Text input with optional label, hint and error.
 *
 * @param {object} props
 * @param {string} [props.id]              Input id (auto-generated if omitted).
 * @param {React.ReactNode} [props.label]
 * @param {React.ReactNode} [props.hint]
 * @param {React.ReactNode} [props.error]
 * @param {'md'|'lg'} [props.size='md']    'lg' = the larger title style.
 * @param {string} [props.className]       Extra classes on the <input>.
 * @param {string} [props.fieldClassName]  Extra classes on the field wrapper.
 * Any other props (value, onChange, type, placeholder, …) go to the <input>.
 */
const Input = ({ id, label, hint, error, size = 'md', className = '', fieldClassName = '', ...props }) => {
    const autoId = useId()
    const inputId = id ?? autoId

    return (
        <Field id={inputId} label={label} hint={hint} error={error} className={fieldClassName}>
            <input
                type="text"
                {...props}
                id={inputId}
                className={`form__input ${size === 'lg' ? 'form__input--title' : ''} ${className}`}
                {...fieldAria(inputId, { hint, error })}
            />
        </Field>
    )
}

export default Input
