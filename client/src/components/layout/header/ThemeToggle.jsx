import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Icon from '@/components/ui/icon/Icon'
import './ThemeToggle.scss'

const STORAGE_KEY = 'theme'
const THEMES = ['light', 'auto', 'dark']

const THEME_META = {
    light: { label: 'Light', icon: 'IconSun' },
    auto: { label: 'Auto', icon: 'IconMonitor' },
    dark: { label: 'Dark', icon: 'IconMoon' },
}

const applyTheme = (theme) => {
    if (theme === 'auto') {
        document.documentElement.removeAttribute('data-theme')
    } else {
        document.documentElement.setAttribute('data-theme', theme)
    }
}

const ThemeToggle = () => {
    // Read the stored preference synchronously, before first paint —
    // avoids an extra render-then-correct cycle that would make the
    // indicator visibly slide right after page load if the saved
    // theme isn't "auto".
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        return THEMES.includes(stored) ? stored : 'auto'
    })

    const indicatorRef = useRef(null)
    const buttonRefs = useRef({})
    const isFirstMove = useRef(true)

    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    // Slide the indicator behind whichever button is active. Snaps
    // instantly on first mount (no slide-in from nowhere), animates on
    // every change after that.
    useLayoutEffect(() => {
        const button = buttonRefs.current[theme]
        const indicator = indicatorRef.current
        if (!button || !indicator) return

        const { offsetLeft, offsetWidth } = button

        if (isFirstMove.current) {
            gsap.set(indicator, { x: offsetLeft, width: offsetWidth })
            isFirstMove.current = false
        } else {
            gsap.to(indicator, {
                x: offsetLeft,
                width: offsetWidth,
                duration: 0.35,
                ease: 'power3.out'
            })
        }
    }, [theme])

    const selectTheme = (next) => {
        setTheme(next)
        localStorage.setItem(STORAGE_KEY, next)
    }

    return (
        <div className="theme-toggle" role="radiogroup" aria-label="Theme">
            <span className="theme-toggle__indicator" ref={indicatorRef} aria-hidden="true" />
            {THEMES.map((option) => (
                <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={theme === option}
                    ref={(el) => (buttonRefs.current[option] = el)}
                    className={`theme-toggle__option${theme === option ? ' is-active' : ''}`}
                    onClick={() => selectTheme(option)}
                >
                    <Icon name={THEME_META[option].icon} size={16} className="theme-toggle__icon" />
                    {/* <span className="theme-toggle__label">{THEME_META[option].label}</span> */}
                </button>
            ))}
        </div>
    )
}

export default ThemeToggle