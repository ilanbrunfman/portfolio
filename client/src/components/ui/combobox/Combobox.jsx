import { useEffect, useId, useRef, useState } from 'react'
import Icon from '@/components/ui/icon/Icon'
import './Combobox.scss'

/**
 * Text input with a suggestion list: type anything, or pick a suggestion.
 * Follows the WAI-ARIA combobox pattern (list autocomplete, manual selection).
 *
 * The list opens on focus, on typing, or from the caret button, and filters
 * to suggestions containing the typed text. Picking one fills the input; the
 * value stays free text either way.
 *
 * Keyboard: ↓/↑ move through suggestions (↓ opens the list), Enter picks the
 * highlighted one, Escape closes the list (the text is kept). With nothing
 * highlighted, Enter submits the surrounding form.
 *
 * @param {object} props
 * @param {string} props.id                       Input id (pair with a <label htmlFor>).
 * @param {string} props.value                    Controlled input value.
 * @param {(value: string) => void} props.onChange Called with the new text.
 * @param {string[]} props.options                Suggestions.
 * @param {string} [props.inputClassName]         Classes for the input (e.g. `form__input`).
 * @param {string} [props.className]              Extra classes on the wrapper.
 * @param {string} [props.toggleLabel]            Accessible name for the caret button.
 * Any other props (placeholder, autoFocus, …) go to the <input>.
 */
const Combobox = ({
    id,
    value,
    onChange,
    options,
    inputClassName = '',
    className = '',
    toggleLabel = 'Show suggestions',
    ...inputProps
}) => {
    const [open, setOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const listId = `${useId()}-list`
    const wrapperRef = useRef(null)
    const inputRef = useRef(null)
    const listRef = useRef(null)

    // An exact match (e.g. just picked) shows every option, so it's easy to switch.
    const query = value.trim().toLowerCase()
    const isExact = options.some((option) => option.toLowerCase() === query)
    const filtered = query && !isExact ? options.filter((option) => option.toLowerCase().includes(query)) : options
    const isOpen = open && filtered.length > 0
    const optionId = (index) => `${listId}-${index}`

    const close = () => {
        setOpen(false)
        setActiveIndex(-1)
    }

    const pick = (option) => {
        onChange(option)
        close()
    }

    // Close when focus or a click lands outside the component.
    useEffect(() => {
        if (!open) return
        const handlePointer = (event) => {
            if (!wrapperRef.current?.contains(event.target)) close()
        }
        document.addEventListener('pointerdown', handlePointer)
        return () => document.removeEventListener('pointerdown', handlePointer)
    }, [open])

    // Keep the highlighted option scrolled into view.
    useEffect(() => {
        if (activeIndex < 0) return
        listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex])

    const handleKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault()
                if (!isOpen) {
                    setOpen(true)
                    setActiveIndex(0)
                } else {
                    setActiveIndex((i) => (i + 1) % filtered.length)
                }
                break
            case 'ArrowUp':
                event.preventDefault()
                if (!isOpen) {
                    setOpen(true)
                    setActiveIndex(filtered.length - 1)
                } else {
                    setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1))
                }
                break
            case 'Enter':
                // Only intercept when a suggestion is highlighted; otherwise let the form submit.
                if (isOpen && activeIndex >= 0) {
                    event.preventDefault()
                    pick(filtered[activeIndex])
                }
                break
            case 'Escape':
                if (isOpen) {
                    event.preventDefault()
                    close()
                }
                break
            case 'Tab':
                close()
                break
            default:
        }
    }

    // Bold the typed part inside each suggestion.
    const renderOption = (option) => {
        const start = query && !isExact ? option.toLowerCase().indexOf(query) : -1
        if (start < 0) return option
        const end = start + query.length
        return (
            <>
                {option.slice(0, start)}
                <mark>{option.slice(start, end)}</mark>
                {option.slice(end)}
            </>
        )
    }

    return (
        <div className={`combobox ${isOpen ? 'is-open' : ''} ${className}`} ref={wrapperRef}>
            <input
                {...inputProps}
                id={id}
                ref={inputRef}
                className={`combobox__input ${inputClassName}`}
                type="text"
                role="combobox"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={isOpen}
                aria-controls={listId}
                aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
                value={value}
                onChange={(event) => {
                    onChange(event.target.value)
                    setOpen(true)
                    setActiveIndex(-1)
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
            />

            <button
                type="button"
                className="combobox__toggle"
                tabIndex={-1}
                aria-label={toggleLabel}
                aria-expanded={isOpen}
                aria-controls={listId}
                onClick={() => {
                    if (isOpen) {
                        close()
                    } else {
                        setOpen(true)
                        inputRef.current?.focus()
                    }
                }}
            >
                <Icon name="IconCaretUp" size={16} className="combobox__caret" />
            </button>

            <ul className="combobox__list" id={listId} role="listbox" ref={listRef} hidden={!isOpen}>
                {filtered.map((option, index) => (
                    <li
                        key={option}
                        id={optionId(index)}
                        className={`combobox__option ${index === activeIndex ? 'is-active' : ''}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        // mousedown (not click) so the input doesn't blur first
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => pick(option)}
                        onMouseMove={() => index !== activeIndex && setActiveIndex(index)}
                    >
                        {renderOption(option)}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default Combobox
