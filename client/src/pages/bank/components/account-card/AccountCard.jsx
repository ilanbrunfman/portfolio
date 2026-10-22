import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/bank/utils/money'
import { ACCOUNT_TYPE_LABEL } from '@/pages/bank/data/accountTypes'
import './AccountCard.scss'

/**
 * One account: name, type, balance and number of transactions.
 *
 * @param {object} props
 * @param {object} props.account   Account from the API (with balance, transactionCount).
 * @param {(account: object) => void} [props.onEdit]  Shows an Edit button when given.
 */
const AccountCard = ({ account, onEdit }) => {
    const { name, type, color, balance, transactionCount, archived } = account

    return (
        <article
            className={`account-card surface d-flex flex-column gap-0-5 ${archived ? 'is-archived' : ''}`}
            style={{ '--account-color': color ?? 'var(--accent)' }}
        >
            <div className="d-flex justify-between align-items-start gap-1">
                <div className="d-flex flex-column">
                    <h3 className="account-card__name">{name}</h3>
                    <span className="account-card__type">
                        {ACCOUNT_TYPE_LABEL[type]}
                        {archived && ' · Archived'}
                    </span>
                </div>
                {onEdit && (
                    <Button variant="ghost" size="sm" onClick={() => onEdit(account)} aria-label={`Edit ${name}`}>
                        Edit
                    </Button>
                )}
            </div>
            <p className={`account-card__balance ${balance < 0 ? 'is-negative' : ''}`}>{formatMoney(balance)}</p>
            <span className="account-card__meta">
                {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}
            </span>
        </article>
    )
}

export default AccountCard
