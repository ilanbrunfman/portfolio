import { Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/pages/bank/context/AuthContext'
import { BankProvider } from '@/pages/bank/context/BankContext'
import AuthForm from '@/pages/bank/components/auth-form/AuthForm'
import SideNavLayout from '@/components/layout/side-nav/SideNavLayout'
import './BankApp.scss'

const HOME_LINK = { to: '/', icon: 'IconHome', label: 'Portfolio home', end: true }
const ACCOUNTS_LINK = { to: '/bank', icon: 'IconCards', label: 'Accounts' }

/**
 * Bank tracker layout (/bank/*): icon nav (sidebar on tablet/desktop,
 * bottom bar on phones) + the current page. Logged out → a centered login
 * card; logged in → header + page, with data from the Express API.
 */
const BankApp = () => (
    <AuthProvider>
        <BankShell />
    </AuthProvider>
)

const BankShell = () => {
    const { user, status, logout } = useAuth()

    if (status === 'checking' || !user) {
        return (
            <SideNavLayout label="Bank" links={[HOME_LINK]}>
                <div className="bank__center d-flex align-items-center justify-center">
                    {status === 'checking' ? <p>Loading…</p> : <AuthForm />}
                </div>
            </SideNavLayout>
        )
    }

    // key: a different user gets a brand-new BankProvider (no leftover data)
    return (
        <BankProvider key={user.id}>
            <SideNavLayout
                label="Bank"
                links={[HOME_LINK, ACCOUNTS_LINK]}
                actions={[{ icon: 'IconSignOut', label: 'Log out', onClick: logout }]}
            >
                <div className="bank container d-flex flex-column gap-2 py-2">
                    <header className="d-flex flex-wrap justify-between align-items-baseline gap-0-5">
                        <h1 className="bank__title">Bank tracker</h1>
                        <span className="bank__user" title="Logged in as">{user.email}</span>
                    </header>
                    <main>
                        <Outlet />
                    </main>
                </div>
            </SideNavLayout>
        </BankProvider>
    )
}

export default BankApp
