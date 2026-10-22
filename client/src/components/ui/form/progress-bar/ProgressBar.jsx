import { useId } from 'react'
import './ProgressBar.scss'

/**
 * Horizontal progress bar with an optional label and value readout.
 *
 * @param {object} props
 * @param {number} props.value                 Current amount.
 * @param {number} [props.max=100]
 * @param {React.ReactNode} [props.label]      Text above the bar (also its accessible name).
 * @param {string} [props.valueText]           Readout + screen-reader text, e.g. "3 of 10". Defaults to a percentage.
 * @param {boolean} [props.showValue=true]     Show the readout.
 * @param {string} [props.className]
 */
const ProgressBar = ({ value, max = 100, label, valueText, showValue = true, className = '' }) => {
    const labelId = useId()
    const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
    const readout = valueText ?? `${Math.round(percent)}%`

    return (
        <div className={`progress d-flex flex-column gap-0-5 ${className}`}>
            {(label || showValue) && (
                <div className="d-flex align-items-center justify-between gap-1">
                    {label && (
                        <span id={labelId} className="progress__label">
                            {label}
                        </span>
                    )}
                    {showValue && <span className="progress__value">{readout}</span>}
                </div>
            )}
            <div
                className="progress__track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={value}
                aria-valuetext={readout}
                aria-labelledby={label ? labelId : undefined}
            >
                <div className="progress__fill" style={{ transform: `scaleX(${percent / 100})` }} />
            </div>
        </div>
    )
}

export default ProgressBar
