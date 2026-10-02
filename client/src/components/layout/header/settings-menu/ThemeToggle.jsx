import Icon from '@/components/ui/icon/Icon'
import { useTheme } from '@/context/ThemeContext'
import './ThemeToggle.scss'

const THEME_META = {
    light: { label: 'Light', icon: 'IconSun' },
    auto: { label: 'Auto', icon: 'IconMonitor' },
    dark: { label: 'Dark', icon: 'IconMoon' },
}

/**
 * Theme selector control (Light / Auto / Dark). Renders as a segmented
 * radiogroup — used as the content of the Theme section in the settings menu.
 */
const ThemeToggle = () => {
    const { theme, setTheme, THEMES } = useTheme()

    return (
        <div className="theme-toggle" role="radiogroup" aria-label="Theme">
            {THEMES.map((option) => (
                <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={theme === option}
                    className={`theme-toggle__option${theme === option ? ' is-active' : ''}`}
                    onClick={() => setTheme(option)}
                >
                    <Icon name={THEME_META[option].icon} size={16} className="theme-toggle__option-icon" />
                    <span className="theme-toggle__option-label">{THEME_META[option].label}</span>
                </button>
            ))}
        </div>
    )
}

export default ThemeToggle
