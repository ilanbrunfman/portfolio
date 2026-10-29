import { Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/pages/bank/context/AuthContext'
import { BankProvider } from '@/pages/bank/context/BankContext'
import AuthForm from '@/pages/bank/components/auth-form/AuthForm'
import SideNavLayout from '@/components/layout/side-nav/SideNavLayout'
import Button from '@/components/ui/button/Button'
import './BankApp.scss'

const HOME_LINK = { to: '/', icon: 'IconHome', label: 'Portfolio home', shortLabel: 'Home', end: true }
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
    const { user, status, retry, logout } = useAuth()

    if (status !== 'ready' || !user) {
        return (
            <SideNavLayout label="Bank" links={[HOME_LINK]}>
                <div className="bank__center d-flex align-items-center justify-center">
                    {status === 'checking' && <p role="status">Loading…</p>}
                    {status === 'ready' && <AuthForm />}
                    {status === 'unreachable' && <Unreachable onRetry={retry} />}
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

/**
 * The API isn't answering. The bank tracker runs on a local server
 * (server/ + Docker), so explain how to start it – or, on a built copy of
 * the site without that server, that the demo runs locally.
 */
const Unreachable = ({ onRetry }) => (
    <div className="bank__notice surface d-flex flex-column gap-1 align-items-start" role="alert">
        <span className="bank__account-type">Bank tracker</span>
        {import.meta.env.DEV ? (
            <>
                <p>Can't reach the bank API.</p>
                <p className="form__hint">
                    In <code>server/</code>, start the database with <code>docker compose up -d</code> and
                    the API with <code>npm run dev</code>, then try again.
                </p>
            </>
        ) : (
            <>
                <p>The bank demo runs on a local server, so it isn't available here.</p>
                <p className="form__hint">
                    The <a href="https://github.com/ilanbrunfman/portfolio" target="_blank" rel="noopener noreferrer">project on GitHub</a> explains
                    how to run it on your machine in a few minutes.
                </p>
            </>
        )}
        <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
)

export default BankApp
