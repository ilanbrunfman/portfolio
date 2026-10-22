import { Link, Outlet } from 'react-router-dom'
import { BankProvider } from '@/pages/bank/context/BankContext'
import Icon from '@/components/ui/icon/Icon'
import './BankApp.scss'

/**
 * Bank tracker layout (/bank/*): header + the current page.
 * Data comes from the Express API (server/) through BankProvider.
 */
const BankApp = () => (
    <BankProvider>
        {/* .row = full width (#root is a flex column, which would shrink the container) */}
        <div className="row">
            <div className="bank container d-flex flex-column gap-2 py-4">
                <header className="d-flex align-items-center gap-1">
                    <Link to="/" className="bank__home" aria-label="Home">
                        <Icon name="IconHome" size={20} />
                    </Link>
                    <h1 className="bank__title">Bank tracker</h1>
                </header>
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    </BankProvider>
)

export default BankApp
