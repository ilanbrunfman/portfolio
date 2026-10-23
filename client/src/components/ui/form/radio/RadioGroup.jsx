import { useId } from 'react'
import './RadioGroup.scss'

/**
 * A labelled set of radio buttons (one choice).
 *
 * @param {object} props
 * @param {React.ReactNode} [props.label]   Group label (rendered as the <legend>).
 * @param {{ value: string, label: React.ReactNode, disabled?: boolean }[]} props.options
 * @param {string} props.value              The selected value.
 * @param {(value: string) => void} props.onChange
 * @param {string} [props.name]             Radio name (auto-generated if omitted).
 * @param {'column'|'row'} [props.direction='column']
 * @param {string} [props.className]        Extra classes on the <fieldset>.
 */
const RadioGroup = ({ label, options, value, onChange, name, direction = 'column', className = '' }) => {
    const autoName = useId()
    const groupName = name ?? autoName

    return (
        <fieldset className={`radio-group d-flex flex-column gap-0-5 ${className}`}>
            {label && <legend className="form__label">{label}</legend>}
            <div className={direction === 'row' ? 'd-flex flex-wrap gap-1' : 'd-flex flex-column gap-0-5'}>
                {options.map((option) => (
                    <label
                        key={option.value}
                        className={`radio d-inline-flex align-items-center gap-0-5 ${option.disabled ? 'is-disabled' : ''}`}
                    >
                        <input
                            type="radio"
                            className="radio__input"
                            name={groupName}
                            value={option.value}
                            checked={value === option.value}
                            disabled={option.disabled}
                            onChange={() => onChange(option.value)}
                        />
                        <span className="radio__label">{option.label}</span>
                    </label>
                ))}
            </div>
        </fieldset>
    )
}

export default RadioGroup
