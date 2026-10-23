import { Link, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/pages/bank/context/AuthContext'
import { BankProvider } from '@/pages/bank/context/BankContext'
import AuthForm from '@/pages/bank/components/auth-form/AuthForm'
import Icon from '@/components/ui/icon/Icon'
import Button from '@/components/ui/button/Button'
import './BankApp.scss'

/**
 * Bank tracker layout (/bank/*). Logged out → the login form; logged in →
 * header + the current page, with data from the Express API (server/).
 */
const BankApp = () => (
    <AuthProvider>
        {/* .row = full width (#root is a flex column, which would shrink the container) */}
        <div className="row">
            <div className="bank container d-flex flex-column gap-2 py-4">
                <BankShell />
            </div>
        </div>
    </AuthProvider>
)

const BankShell = () => {
    const { user, status, logout } = useAuth()

    const header = (
        <header className="d-flex flex-wrap align-items-center gap-1">
            <Link to="/" className="bank__home" aria-label="Home">
                <Icon name="IconHome" size={20} />
            </Link>
            <h1 className="bank__title mr-auto">Bank tracker</h1>
            {user && (
                <div className="d-flex align-items-center gap-0-5">
                    <span className="bank__user">{user.email}</span>
                    <Button variant="ghost" size="sm" icon="IconSignOut" onClick={logout}>Log out</Button>
                </div>
            )}
        </header>
    )

    if (status === 'checking') return <>{header}<p>Loading…</p></>
    if (!user) return <>{header}<main><AuthForm /></main></>

    // key: a different user gets a brand-new BankProvider (no leftover data)
    return (
        <BankProvider key={user.id}>
            {header}
            <main>
                <Outlet />
            </main>
        </BankProvider>
    )
}

export default BankApp
