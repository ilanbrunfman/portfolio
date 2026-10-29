import { Outlet } from 'react-router-dom'
import { StaffProvider, useStaff } from '@/pages/taim/context/StaffContext'
import WhoAreYou from '@/pages/taim/components/who-are-you/WhoAreYou'
import { SCREENS, ROLE_LABELS } from '@/pages/taim/data/screens'
import SideNavLayout from '@/components/layout/side-nav/SideNavLayout'
import Button from '@/components/ui/button/Button'
import './TaimApp.scss'

const HOME_LINK = { to: '/', icon: 'IconHome', label: 'Portfolio home', shortLabel: 'Home', end: true }

/**
 * Ta'im layout (/taim/*): icon nav (sidebar on tablet/desktop, bottom bar
 * on phones) + the current screen. Nobody picked → "Who are you?";
 * picked → only the screens that person's role may use.
 */
const TaimApp = () => (
    <StaffProvider>
        {/* Ta'im's own accent colour for everything inside, nav included */}
        <div className="taim-theme">
            <TaimShell />
        </div>
    </StaffProvider>
)

const TaimShell = () => {
    const { session, status, retry, switchPerson } = useStaff()

    if (status !== 'ready' || !session) {
        return (
            <SideNavLayout label="Ta'im" links={[HOME_LINK]}>
                <div className="taim__center d-flex align-items-center justify-center">
                    {status === 'checking' && <p role="status">Loading…</p>}
                    {status === 'ready' && <WhoAreYou />}
                    {status === 'unreachable' && <Unreachable onRetry={retry} />}
                </div>
            </SideNavLayout>
        )
    }

    const { staff, screens } = session
    const links = SCREENS
        .filter((screen) => screens.includes(screen.id))
        .map((screen) => ({ to: `/taim/${screen.id}`, icon: screen.icon, label: screen.label, shortLabel: screen.shortLabel }))

    // key: picking someone else starts their screens fresh
    return (
        <SideNavLayout
            key={staff.id}
            label="Ta'im"
            links={[HOME_LINK, ...links]}
            actions={[{ icon: 'IconSignOut', label: 'Switch person', shortLabel: 'Switch', onClick: switchPerson }]}
        >
            <div className="taim container d-flex flex-column gap-2 py-2">
                <header className="d-flex flex-wrap justify-between align-items-baseline gap-0-5">
                    <h1 className="taim__title">Ta'im</h1>
                    <span className="taim__who">
                        {staff.name} · <span className="taim__eyebrow">{ROLE_LABELS[staff.role]}</span>
                    </span>
                </header>
                <main>
                    <Outlet />
                </main>
            </div>
        </SideNavLayout>
    )
}

/**
 * The API isn't answering. Ta'im runs on the same local server as the bank
 * tracker, so explain how to start it – or, on a built copy of the site
 * without that server, that the demo runs locally.
 */
const Unreachable = ({ onRetry }) => (
    <div className="taim__notice surface d-flex flex-column gap-1 align-items-start" role="alert">
        <span className="taim__eyebrow">Ta'im</span>
        {import.meta.env.DEV ? (
            <>
                <p>Can't reach the Ta'im API.</p>
                <p className="form__hint">
                    In <code>server/</code>, start the database with <code>docker compose up -d</code> and
                    the API with <code>npm run dev</code>, then try again.
                </p>
            </>
        ) : (
            <>
                <p>Ta'im runs on a local server, so it isn't available here.</p>
                <p className="form__hint">
                    The <a href="https://github.com/ilanbrunfman/portfolio" target="_blank" rel="noopener noreferrer">project on GitHub</a> explains
                    how to run it on your machine in a few minutes.
                </p>
            </>
        )}
        <Button variant="secondary" onClick={onRetry}>Try again</Button>
    </div>
)

export default TaimApp
