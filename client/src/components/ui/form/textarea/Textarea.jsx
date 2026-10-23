import { useId } from 'react'
import Field from '@/components/ui/form/field/Field'
import { fieldAria } from '@/components/ui/form/field/fieldAria'

/**
 * Multi-line text input with optional label, hint and error.
 *
 * @param {object} props
 * @param {string} [props.id]              Textarea id (auto-generated if omitted).
 * @param {React.ReactNode} [props.label]
 * @param {React.ReactNode} [props.hint]
 * @param {React.ReactNode} [props.error]
 * @param {number} [props.rows=4]
 * @param {string} [props.className]       Extra classes on the <textarea>.
 * @param {string} [props.fieldClassName]  Extra classes on the field wrapper.
 * Any other props (value, onChange, placeholder, …) go to the <textarea>.
 */
const Textarea = ({ id, label, hint, error, rows = 4, className = '', fieldClassName = '', ...props }) => {
    const autoId = useId()
    const textareaId = id ?? autoId

    return (
        <Field id={textareaId} label={label} hint={hint} error={error} className={fieldClassName}>
            <textarea
                rows={rows}
                {...props}
                id={textareaId}
                className={`form__textarea ${className}`}
                {...fieldAria(textareaId, { hint, error })}
            />
        </Field>
    )
}

export default Textarea
