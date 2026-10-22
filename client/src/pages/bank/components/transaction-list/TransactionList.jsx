import { formatMoney } from '@/pages/bank/utils/money'
import { formatDay } from '@/pages/bank/utils/date'
import './TransactionList.scss'

/**
 * An account's transactions, newest first, grouped by day. Each row shows
 * the description, category (or "Transfer"), amount and the balance after it.
 *
 * @param {object} props
 * @param {object[]} props.items                    Transactions from the API (with runningBalance).
 * @param {(transaction: object) => void} [props.onSelect]  Makes rows clickable (e.g. to edit).
 * @param {Record<number, string>} [props.accountNames]  id → name, to label transfers "To X" / "From X".
 */
const TransactionList = ({ items, onSelect, accountNames = {} }) => {
    const transferLabel = (t) => {
        const other = accountNames[t.counterpartAccountId]
        if (!other) return 'Transfer'
        return t.amount < 0 ? `To ${other}` : `From ${other}`
    }

    // [{ day, rows: [...] }] – items are already sorted newest first
    const days = []
    for (const item of items) {
        if (days.at(-1)?.day !== item.date) days.push({ day: item.date, rows: [] })
        days.at(-1).rows.push(item)
    }

    return (
        <div className="transaction-list d-flex flex-column gap-1">
            {days.map(({ day, rows }) => (
                <section key={day} className="d-flex flex-column" aria-label={formatDay(day)}>
                    <h3 className="transaction-list__day">{formatDay(day)}</h3>
                    <ul className="transaction-list__rows">
                        {rows.map((t) => {
                            const content = (
                                <>
                                    <span className="d-flex flex-column">
                                        <span className="transaction-list__description">{t.description}</span>
                                        <span className="transaction-list__meta d-flex flex-wrap align-items-center gap-0-5">
                                            {t.transferId ? (
                                                <span className="transaction-list__tag">{transferLabel(t)}</span>
                                            ) : t.category ? (
                                                <span className="transaction-list__tag" style={{ '--tag': t.category.color }}>
                                                    {t.category.name}
                                                </span>
                                            ) : null}
                                            {t.note && <span className="transaction-list__note">{t.note}</span>}
                                        </span>
                                    </span>
                                    <span className="d-flex flex-column align-items-end">
                                        <span className={`transaction-list__amount ${t.amount > 0 ? 'is-in' : ''}`}>
                                            {t.amount > 0 ? '+' : ''}{formatMoney(t.amount)}
                                        </span>
                                        <span className="transaction-list__running" title="Balance after this transaction">
                                            {formatMoney(t.runningBalance)}
                                        </span>
                                    </span>
                                </>
                            )
                            const rowClass = 'transaction-list__row d-flex justify-between align-items-center gap-1'
                            return (
                                <li key={t.id}>
                                    {onSelect ? (
                                        <button type="button" className={rowClass} onClick={() => onSelect(t)}>
                                            {content}
                                        </button>
                                    ) : (
                                        <div className={rowClass}>{content}</div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </section>
            ))}
        </div>
    )
}

export default TransactionList
