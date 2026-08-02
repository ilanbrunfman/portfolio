import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './ThemeToggle.scss'

const STORAGE_KEY = 'theme'
const THEMES = ['light', 'auto', 'dark']

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
                    {option === 'light' && 'Light'}
                    {option === 'dark' && 'Dark'}
                    {option === 'auto' && 'Auto'}
                </button>
            ))}
        </div>
    )
}

export default ThemeToggle