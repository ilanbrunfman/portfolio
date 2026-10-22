import { useParams } from 'react-router-dom'
import { useBank } from '@/pages/bank/context/BankContext'
import { useLedger } from '@/pages/bank/hooks/useLedger'
import Button from '@/components/ui/button/Button'
import TransactionList from '@/pages/bank/components/transaction-list/TransactionList'
import { formatMoney } from '@/pages/bank/utils/money'
import { ACCOUNT_TYPE_LABEL } from '@/pages/bank/data/accountTypes'

/**
 * /bank/accounts/:id – one account: balance and its transactions.
 */
const AccountPage = () => {
    const { id } = useParams()
    const { accounts, status } = useBank()

    if (status === 'loading') return <p>Loading…</p>

    const account = accounts.find((a) => a.id === Number(id))
    if (!account) {
        return (
            <div className="d-flex flex-column gap-1 align-items-start">
                <p>Account not found.</p>
                <Button variant="secondary" icon="IconArrowLeft" to="/bank">All accounts</Button>
            </div>
        )
    }

    // key: a different account starts with a fresh ledger
    return <AccountLedger key={account.id} account={account} />
}

const AccountLedger = ({ account }) => {
    const { items, status, error, hasMore, loadingMore, loadMore } = useLedger(account.id)

    return (
        <div className="d-flex flex-column gap-2" style={{ '--account-color': account.color ?? 'var(--accent)' }}>
            <Button variant="ghost" size="sm" icon="IconArrowLeft" to="/bank" className="align-self-start">
                All accounts
            </Button>

            <section className="d-flex flex-column gap-0-5" aria-label="Account">
                <span className="bank__account-type">
                    {ACCOUNT_TYPE_LABEL[account.type]}
                    {account.archived && ' · Archived'}
                </span>
                <h2 className="bank__account-name">{account.name}</h2>
                <strong className={`bank__total ${account.balance < 0 ? 'is-negative' : ''}`}>
                    {formatMoney(account.balance)}
                </strong>
            </section>

            {status === 'loading' && <p>Loading transactions…</p>}
            {error && <p className="form__error" role="alert">{error}</p>}
            {status === 'ready' && items.length === 0 && <p>No transactions yet.</p>}

            {items.length > 0 && <TransactionList items={items} />}

            {hasMore && (
                <Button variant="secondary" onClick={loadMore} disabled={loadingMore} className="align-self-center">
                    {loadingMore ? 'Loading…' : 'Load older transactions'}
                </Button>
            )}
        </div>
    )
}

export default AccountPage
