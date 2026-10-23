import { useState } from 'react'
import { useAuth } from '@/pages/bank/context/AuthContext'
import Input from '@/components/ui/form/input/Input'
import Button from '@/components/ui/button/Button'

/**
 * Log in or sign up for the bank tracker (one form, two modes).
 */
const AuthForm = () => {
    const { authenticate } = useAuth()
    const [mode, setMode] = useState('login') // 'login' | 'signup'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState({})
    const [busy, setBusy] = useState(false)
    const isLogin = mode === 'login'

    const switchMode = () => {
        setMode(isLogin ? 'signup' : 'login')
        setErrors({})
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const found = {}
        if (!email.trim()) found.email = 'Email is required'
        if (!password) found.password = 'Password is required'
        else if (!isLogin && password.length < 8) found.password = 'Use at least 8 characters'
        if (Object.keys(found).length > 0) return setErrors(found)

        setBusy(true)
        try {
            await authenticate(mode, { email, password })
            // AuthProvider now has the user → the bank app shows instead of this form
        } catch (err) {
            const { _: general, ...fields } = err.fields ?? {}
            setErrors({ ...fields, form: Object.keys(fields).length ? general : (general ?? err.message) })
            setBusy(false)
        }
    }

    return (
        <form className="surface d-flex flex-column gap-1 bank__auth" onSubmit={handleSubmit} noValidate>
            <div className="d-flex flex-column gap-0-5">
                <span className="bank__account-type">Bank tracker</span>
                <h1 className="bank__account-name">{isLogin ? 'Log in' : 'Create an account'}</h1>
            </div>
            {errors.form && <p className="form__error" role="alert">{errors.form}</p>}

            <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({}) }}
                error={errors.email}
                autoComplete="email"
                autoFocus
            />
            <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors({}) }}
                error={errors.password}
                hint={isLogin ? undefined : 'At least 8 characters'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
            />

            <Button type="submit" disabled={busy}>
                {busy ? 'One moment…' : isLogin ? 'Log in' : 'Sign up'}
            </Button>

            <p className="d-flex flex-wrap align-items-center gap-0-5">
                {isLogin ? 'No account yet?' : 'Already have an account?'}
                <Button variant="ghost" size="sm" onClick={switchMode}>
                    {isLogin ? 'Sign up' : 'Log in'}
                </Button>
            </p>

            {/* Local development only: the seeded demo user */}
            {import.meta.env.DEV && isLogin && (
                <p className="form__hint">Demo (local): demo@bank.test / demo1234</p>
            )}
        </form>
    )
}

export default AuthForm
