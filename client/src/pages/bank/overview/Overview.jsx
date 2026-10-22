import { useBank } from '@/pages/bank/context/BankContext'
import Button from '@/components/ui/button/Button'
import AccountCard from '@/pages/bank/components/account-card/AccountCard'
import { formatMoney } from '@/pages/bank/utils/money'

/**
 * /bank – total balance and a card per account.
 */
const Overview = () => {
    const { accounts, status, error, reload } = useBank()

    if (status === 'loading') return <p>Loading accounts…</p>

    if (status === 'error') {
        return (
            <div className="d-flex flex-column gap-1 align-items-start" role="alert">
                <p>
                    {error}.{' '}
                    {error === 'API not reachable'
                        ? <>Start the API with <code>npm run dev</code> in <code>server/</code>.</>
                        : <>If the database is down, run <code>docker compose up -d</code> in <code>server/</code>.</>}
                </p>
                <Button variant="secondary" onClick={reload}>Try again</Button>
            </div>
        )
    }

    const active = accounts.filter((a) => !a.archived)
    const total = active.reduce((sum, a) => sum + a.balance, 0)

    return (
        <div className="d-flex flex-column gap-2">
            <section className="d-flex flex-column gap-0-5" aria-label="Total balance">
                <span>Total balance</span>
                <strong className="bank__total">{formatMoney(total)}</strong>
            </section>

            {active.length === 0 ? (
                <p>No accounts yet.</p>
            ) : (
                <div className="d-grid grid-1 grid-sm-2 grid-lg-3 gap-1">
                    {active.map((account) => (
                        <AccountCard key={account.id} account={account} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Overview
