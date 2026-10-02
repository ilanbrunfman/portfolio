import { useId, useState } from 'react'
import Icon from '@/components/ui/icon/Icon'
import './Accordion.scss'

/**
 * Container for a set of <Accordion.Item>s (also exported as { AccordionItem }).
 * Multi-open: each item manages its own expanded state, so any number can be
 * open at once.
 */
const Accordion = ({ children, className = '' }) => (
    <div className={`accordion ${className}`.trim()}>{children}</div>
)

/**
 * A single collapsible section.
 *
 * Uncontrolled by default via `defaultOpen`; pass `open` + `onToggle` to drive
 * it from a parent instead (e.g. to coordinate sections or force single-open).
 *
 * Note: collapsed content stays mounted — the height animation needs it in the
 * DOM — so anything expensive nested here still runs while hidden. Gate such
 * work on the open state (or render it conditionally) if that matters.
 *
 * @param {object} props
 * @param {React.ReactNode} props.title            Section heading.
 * @param {boolean} [props.defaultOpen]            Initial state when uncontrolled.
 * @param {boolean} [props.open]                   Controlled open state.
 * @param {(next: boolean) => void} [props.onToggle] Controlled toggle handler.
 * @param {React.ReactNode} props.children         Collapsible content.
 */
const AccordionItem = ({ title, defaultOpen = false, open, onToggle, children }) => {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
    const isControlled = open !== undefined
    const isOpen = isControlled ? open : uncontrolledOpen

    const headerId = useId()
    const contentId = useId()

    const handleToggle = () => {
        const next = !isOpen
        if (isControlled) {
            onToggle?.(next)
        } else {
            setUncontrolledOpen(next)
        }
    }

    return (
        <div className={`accordion__item${isOpen ? ' is-open' : ''}`}>
            <button
                type="button"
                id={headerId}
                className="accordion__header"
                aria-expanded={isOpen}
                aria-controls={contentId}
                onClick={handleToggle}
            >
                <span className="accordion__title">{title}</span>
                <Icon name="IconChevronRight" size={16} className="accordion__chevron" />
            </button>

            {/* Content stays mounted and animates via grid-template-rows; `inert`
                removes it from tab order + the a11y tree while collapsed. */}
            <div
                id={contentId}
                className="accordion__panel"
                role="region"
                aria-labelledby={headerId}
                inert={!isOpen}
            >
                <div className="accordion__panel-inner">
                    <div className="accordion__panel-content">{children}</div>
                </div>
            </div>
        </div>
    )
}

// Compound API (<Accordion.Item>) plus a named export for direct import.
Accordion.Item = AccordionItem

export default Accordion
export { AccordionItem }
