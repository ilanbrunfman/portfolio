import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'
const THEMES = ['light', 'auto', 'dark']

const applyTheme = (theme) => {
    if (theme === 'auto') {
        document.documentElement.removeAttribute('data-theme')
    } else {
        document.documentElement.setAttribute('data-theme', theme)
    }
}

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
    // Read the stored preference synchronously, before first paint —
    // avoids an extra render-then-correct cycle that would make the
    // indicator visibly slide right after page load if the saved
    // theme isn't "auto".
    const [theme, setThemeState] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        return THEMES.includes(stored) ? stored : 'auto'
    })

    // Runs at the app root regardless of which route/page is active,
    // so the theme is always applied even on pages that don't render
    // the ThemeToggle (e.g. /todos).
    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    const setTheme = (next) => {
        setThemeState(next)
        localStorage.setItem(STORAGE_KEY, next)
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, THEMES }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
    return ctx
}