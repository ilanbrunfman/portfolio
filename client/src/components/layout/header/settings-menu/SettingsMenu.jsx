import { useEffect, useRef, useState } from 'react'
import Icon from '@/components/ui/icon/Icon'
import Accordion from '@/components/ui/accordion/Accordion'
import ThemeToggle from './ThemeToggle'
import './SettingsMenu.scss'

/**
 * Avatar-triggered dropdown holding an accordion of settings. Add future
 * features as more <AccordionItem>s inside the panel.
 */
const SettingsMenu = () => {
    const [isOpen, setIsOpen] = useState(false)
    const rootRef = useRef(null)

    // Close on outside click — same pattern as the other dropdowns in the app.
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

    return (
        <div className={`settings-menu${isOpen ? ' is-open' : ''}`} ref={rootRef}>
            <button
                type="button"
                className="settings-menu__trigger"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="Account and settings"
            >
                <Icon name="IconUser" size={18} className="settings-menu__avatar-icon" />
            </button>

            {isOpen && (
                <div className="settings-menu__panel">
                    <Accordion>
                        <Accordion.Item title="Theme">
                            <ThemeToggle />
                        </Accordion.Item>
                    </Accordion>
                </div>
            )}
        </div>
    )
}

export default SettingsMenu
