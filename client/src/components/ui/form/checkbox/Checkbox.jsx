import './Checkbox.scss'

/**
 * Styled checkbox. With `label` it renders a clickable label row; without,
 * just the box (then pass an `aria-label`).
 *
 * @param {object} props
 * @param {React.ReactNode} [props.label]  Visible label text.
 * @param {string} [props.className]       Extra classes on the outer element.
 * Any other props (checked, onChange, disabled, aria-label, …) go to the <input>.
 */
const Checkbox = ({ label, className = '', ...props }) => {
    const box = <input type="checkbox" {...props} className={`checkbox__input ${label ? '' : className}`} />

    if (!label) return box

    return (
        <label className={`checkbox d-inline-flex align-items-center gap-0-5 ${className}`}>
            {box}
            <span className="checkbox__label">{label}</span>
        </label>
    )
}

export default Checkbox
