import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useBank } from '@/pages/bank/context/BankContext'
import { useLedger } from '@/pages/bank/hooks/useLedger'
import Button from '@/components/ui/button/Button'
import Modal from '@/components/ui/modal/Modal'
import TransactionForm from '@/pages/bank/components/transaction-form/TransactionForm'
import TransferForm from '@/pages/bank/components/transfer-form/TransferForm'
import TransactionList from '@/pages/bank/components/transaction-list/TransactionList'
import LedgerFilters from '@/pages/bank/components/ledger-filters/LedgerFilters'
import { filtersFromParams, filtersToQuery, hasFilters } from '@/pages/bank/components/ledger-filters/filters'
import { formatMoney } from '@/pages/bank/utils/money'
import { ACCOUNT_TYPE_LABEL } from '@/pages/bank/data/accountTypes'

/**
 * /bank/accounts/:id – one account: balance and its transactions, with
 * add / edit / delete in a modal.
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
    const { accounts, categories } = useBank()
    // Filters: React state is the live copy (its updates queue, so quick edits
    // never overwrite each other); the URL gets a copy so a refresh or a shared
    // link keeps them. Read from the URL once, when the page opens.
    const [searchParams, setSearchParams] = useSearchParams()
    const [filters, setFilterState] = useState(() => filtersFromParams(searchParams))
    const filtered = hasFilters(filters)
    const setFilters = useCallback((changes) => setFilterState((current) => ({ ...current, ...changes })), [])

    const filterQuery = filtersToQuery(filters)
    useEffect(() => {
        if (filterQuery !== searchParams.toString()) setSearchParams(filterQuery, { replace: true })
    }, [filterQuery, searchParams, setSearchParams])

    const { items, totals, status, error, stale, hasMore, loadingMore, loadMore, reload } = useLedger(account.id, filters)
    // `transaction` stays set while the modal plays its close animation
    const [editor, setEditor] = useState({ open: false, transaction: null })

    // Transfer modal: new (transferId null) or editing an existing transfer
    const [transferEditor, setTransferEditor] = useState({ open: false, transferId: null })
    const canTransfer = accounts.filter((a) => !a.archived).length >= 2
    const accountNames = Object.fromEntries(accounts.map((a) => [a.id, a.name]))

    const openEditor = (transaction = null) => setEditor({ open: true, transaction })
    const openTransfer = (transferId = null) => setTransferEditor({ open: true, transferId })
    // A row click: transfers open the transfer form, everything else the transaction form
    const handleSelect = (t) => (t.transferId ? openTransfer(t.transferId) : openEditor(t))
    const handleTransferDone = (changed) => {
        setTransferEditor((prev) => ({ ...prev, open: false }))
        if (changed) reload()
    }
    const handleDone = (changed) => {
        setEditor((prev) => ({ ...prev, open: false }))
        if (changed) reload() // re-fetch so running balances are right
    }

    return (
        <div className="d-flex flex-column gap-2" style={{ '--account-color': account.color ?? 'var(--accent)' }}>
            <Button variant="ghost" size="sm" icon="IconArrowLeft" to="/bank" className="align-self-start">
                All accounts
            </Button>

            <div className="d-flex flex-wrap justify-between align-items-end gap-1">
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
                {account.archived ? (
                    <p>Restore this account to add transactions.</p>
                ) : (
                    <div className="d-flex flex-wrap gap-0-5">
                        {canTransfer && (
                            <Button variant="secondary" onClick={() => openTransfer()}>Transfer</Button>
                        )}
                        <Button icon="IconPlus" onClick={() => openEditor()}>Add transaction</Button>
                    </div>
                )}
            </div>

            {(account.transactionCount > 0 || filtered) && (
                <LedgerFilters filters={filters} onChange={setFilters} categories={categories} />
            )}

            {status === 'loading' && <p>Loading transactions…</p>}
            {error && <p className="form__error" role="alert">{error}</p>}
            {status === 'ready' && !stale && items.length === 0 && (
                <p>{filtered ? 'No transactions match these filters.' : 'No transactions yet.'}</p>
            )}
            {filtered && !stale && totals && totals.count > 0 && (
                <p className="bank__totals" aria-live="polite">
                    {totals.count} {totals.count === 1 ? 'match' : 'matches'}
                    {totals.moneyIn > 0 && <> · in <strong className="is-in">+{formatMoney(totals.moneyIn)}</strong></>}
                    {totals.moneyOut < 0 && <> · out <strong>{formatMoney(totals.moneyOut)}</strong></>}
                </p>
            )}

            {items.length > 0 && (
                // While new results load, keep the old ones visible but dimmed
                <div className={stale ? 'bank__stale' : ''} aria-busy={stale}>
                    <TransactionList items={items} onSelect={handleSelect} accountNames={accountNames} />
                </div>
            )}

            {hasMore && (
                <Button variant="secondary" onClick={loadMore} disabled={loadingMore} className="align-self-center">
                    {loadingMore ? 'Loading…' : 'Load older transactions'}
                </Button>
            )}

            <Modal
                isOpen={editor.open}
                onClose={() => handleDone(false)}
                title={editor.transaction ? 'Edit transaction' : 'New transaction'}
            >
                <TransactionForm
                    key={editor.transaction?.id ?? 'new'}
                    account={account}
                    transaction={editor.transaction}
                    recent={items}
                    onDone={handleDone}
                />
            </Modal>

            <Modal
                isOpen={transferEditor.open}
                onClose={() => handleTransferDone(false)}
                title={transferEditor.transferId ? 'Edit transfer' : 'Transfer'}
                size="lg"
            >
                <TransferForm
                    key={transferEditor.transferId ?? 'new'}
                    transferId={transferEditor.transferId}
                    defaultFromId={account.id}
                    onDone={handleTransferDone}
                />
            </Modal>
        </div>
    )
}

export default AccountPage
