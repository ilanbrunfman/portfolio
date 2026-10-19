import { useId, useRef, useState } from 'react'
import './Tabs.scss'

/**
 * Accessible tab strip with a single shared panel.
 *
 * The panel stays mounted across tab changes and renders `children` for the
 * active tab — pass a function to receive the active id. Keeping one panel
 * (rather than one per tab) lets content animate between datasets instead of
 * remounting, e.g. a chart morphing from one endpoint to the next.
 *
 * Uncontrolled by default via `defaultValue`; pass `value` + `onChange` to
 * drive it from a parent instead.
 *
 * Keyboard: ←/→ move between tabs (wrapping), Home/End jump to the ends.
 * Selection follows focus (automatic activation).
 *
 * @param {object} props
 * @param {{ id: string, label: React.ReactNode }[]} props.items  Tabs, in order.
 * @param {string} [props.defaultValue]          Initial active id when uncontrolled (defaults to the first item).
 * @param {string} [props.value]                 Controlled active id.
 * @param {(id: string) => void} [props.onChange] Called with the newly selected id.
 * @param {string} props.label                   Accessible name for the tablist.
 * @param {string} [props.className]             Extra classes on the `.tabs` wrapper.
 * @param {React.ReactNode | ((activeId: string) => React.ReactNode)} props.children Panel content.
 */
const Tabs = ({ items, defaultValue, value, onChange, label, className = '', children }) => {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? items[0]?.id)
    const isControlled = value !== undefined
    const activeId = isControlled ? value : uncontrolledValue

    const baseId = useId()
    const tabId = (id) => `${baseId}-tab-${id}`
    const panelId = `${baseId}-panel`
    const tabRefs = useRef({})

    const select = (id) => {
        if (id === activeId) return
        if (!isControlled) setUncontrolledValue(id)
        onChange?.(id)
    }

    const handleKeyDown = (event) => {
        const index = items.findIndex((item) => item.id === activeId)
        const last = items.length - 1
        const nextIndex = {
            ArrowRight: index === last ? 0 : index + 1,
            ArrowLeft: index === 0 ? last : index - 1,
            Home: 0,
            End: last,
        }[event.key]
        if (nextIndex === undefined) return

        event.preventDefault()
        const nextId = items[nextIndex].id
        select(nextId)
        tabRefs.current[nextId]?.focus()
    }

    return (
        <div className={`tabs ${className}`.trim()}>
            <div className="tabs__list" role="tablist" aria-label={label} onKeyDown={handleKeyDown}>
                {items.map((item) => {
                    const isActive = item.id === activeId
                    return (
                        <button
                            key={item.id}
                            ref={(el) => (tabRefs.current[item.id] = el)}
                            type="button"
                            role="tab"
                            id={tabId(item.id)}
                            className={`tabs__tab${isActive ? ' is-active' : ''}`}
                            aria-selected={isActive}
                            aria-controls={panelId}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => select(item.id)}
                        >
                            {item.label}
                        </button>
                    )
                })}
            </div>

            <div
                id={panelId}
                className="tabs__panel"
                role="tabpanel"
                aria-labelledby={tabId(activeId)}
                tabIndex={0}
            >
                {typeof children === 'function' ? children(activeId) : children}
            </div>
        </div>
    )
}

export default Tabs
