/**
 * Label + control + hint/error wrapper shared by the form controls.
 * Uses the global form classes from `assets/styles/shared/forms.scss`.
 *
 * @param {object} props
 * @param {string} props.id                  The control's id (the label points at it).
 * @param {React.ReactNode} [props.label]    Visible label.
 * @param {React.ReactNode} [props.hint]     Helper text under the control (hidden while there's an error).
 * @param {React.ReactNode} [props.error]    Error message; replaces the hint.
 * @param {string} [props.className]         Extra classes on the field wrapper.
 * @param {React.ReactNode} props.children   The control.
 */
const Field = ({ id, label, hint, error, className = '', children }) => (
    <div className={`form__field d-flex flex-column gap-0-5 ${className}`}>
        {label && (
            <label className="form__label" htmlFor={id}>
                {label}
            </label>
        )}
        {children}
        {error ? (
            <p id={`${id}-error`} className="form__error" role="alert">
                {error}
            </p>
        ) : (
            hint && (
                <p id={`${id}-hint`} className="form__hint">
                    {hint}
                </p>
            )
        )}
    </div>
)

export default Field
