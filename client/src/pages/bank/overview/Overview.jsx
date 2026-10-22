import { useState } from 'react'
import { useBank } from '@/pages/bank/context/BankContext'
import Button from '@/components/ui/button/Button'
import Modal from '@/components/ui/modal/Modal'
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
import AccountCard from '@/pages/bank/components/account-card/AccountCard'
import AccountForm from '@/pages/bank/components/account-form/AccountForm'
import TransferForm from '@/pages/bank/components/transfer-form/TransferForm'
import MonthSummary from '@/pages/bank/components/month-summary/MonthSummary'
import { formatMoney } from '@/pages/bank/utils/money'

/**
 * /bank – total balance, a card per account, add/edit accounts and
 * transfer money between them (modals).
 */
const Overview = () => {
    const { accounts, status, error, reload } = useBank()
    const [showArchived, setShowArchived] = useState(false)
    // `account` stays set while the modal plays its close animation
    const [editor, setEditor] = useState({ open: false, account: null })

    const openEditor = (account = null) => setEditor({ open: true, account })
    const closeEditor = () => setEditor((prev) => ({ ...prev, open: false }))
    const [transferOpen, setTransferOpen] = useState(false)

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
    const archivedCount = accounts.length - active.length
    const visible = showArchived ? accounts : active
    const total = active.reduce((sum, a) => sum + a.balance, 0)

    return (
        <div className="d-flex flex-column gap-2">
            <div className="d-flex flex-wrap justify-between align-items-end gap-1">
                <section className="d-flex flex-column gap-0-5" aria-label="Total balance">
                    <span>Total balance</span>
                    <strong className="bank__total">{formatMoney(total)}</strong>
                </section>
                <div className="d-flex flex-wrap gap-0-5">
                    {active.length >= 2 && (
                        <Button variant="secondary" onClick={() => setTransferOpen(true)}>Transfer</Button>
                    )}
                    <Button icon="IconPlus" onClick={() => openEditor()}>Add account</Button>
                </div>
            </div>

            {visible.length === 0 ? (
                <p>No accounts yet. Add your first one to get started.</p>
            ) : (
                <div className="d-grid grid-1 grid-sm-2 grid-lg-3 gap-1">
                    {visible.map((account) => (
                        <AccountCard key={account.id} account={account} onEdit={openEditor} />
                    ))}
                </div>
            )}

            {archivedCount > 0 && (
                <Checkbox
                    label={`Show archived (${archivedCount})`}
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="align-self-start"
                />
            )}

            {active.length > 0 && <MonthSummary />}

            <Modal
                isOpen={editor.open}
                onClose={closeEditor}
                title={editor.account ? 'Edit account' : 'New account'}
                size="sm"
            >
                <AccountForm key={editor.account?.id ?? 'new'} account={editor.account} onDone={closeEditor} />
            </Modal>

            <Modal isOpen={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer" size="lg">
                <TransferForm onDone={() => setTransferOpen(false)} />
            </Modal>
        </div>
    )
}

export default Overview
