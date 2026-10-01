import { useEffect, useRef, useState } from 'react'
import Icon from '@/components/ui/icon/Icon'
import { useTheme } from '@/context/ThemeContext'
import './ThemeToggle.scss'

const THEME_META = {
    light: { label: 'Light', icon: 'IconSun' },
    auto: { label: 'Auto', icon: 'IconMonitor' },
    dark: { label: 'Dark', icon: 'IconMoon' },
}

const ThemeToggle = () => {
    const { theme, setTheme, THEMES } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const rootRef = useRef(null)

    // Close the panel when clicking anywhere outside it — same pattern
    // as the filter dropdown on the home page.
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close on Escape.
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') setIsOpen(false)
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [])

    const handleSelect = (option) => {
        setTheme(option)
        setIsOpen(false)
    }

    const active = THEME_META[theme]

    return (
        <div className={`theme-toggle${isOpen ? ' is-open' : ''}`} ref={rootRef}>
            <button
                type="button"
                className="theme-toggle__trigger"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label={`Display: ${active.label}`}
            >
                <Icon name={active.icon} size={18} className="theme-toggle__trigger-icon" />
                <Icon name="IconChevronRight" size={14} className="theme-toggle__chevron" />
            </button>

            {isOpen && (
                <div className="theme-toggle__panel" role="menu" aria-label="Display">
                    <p className="theme-toggle__heading">Display</p>
                    {THEMES.map((option) => (
                        <button
                            key={option}
                            type="button"
                            role="menuitemradio"
                            aria-checked={theme === option}
                            className={`theme-toggle__option${theme === option ? ' is-active' : ''}`}
                            onClick={() => handleSelect(option)}
                        >
                            <Icon name={THEME_META[option].icon} size={16} className="theme-toggle__option-icon" />
                            <span className="theme-toggle__option-label">{THEME_META[option].label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ThemeToggle
