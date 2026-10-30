import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { useFloor } from '@/pages/taim/hooks/useFloor'
import { useOrder } from '@/pages/taim/hooks/useOrder'
import { useNow, minutesSince } from '@/pages/taim/hooks/useNow'
import TableCard, { KitchenProgress } from '@/pages/taim/components/table-card/TableCard'
import SeatForm from '@/pages/taim/components/seat-form/SeatForm'
import TableForm from '@/pages/taim/components/table-form/TableForm'
import Ticket from '@/pages/taim/components/ticket/Ticket'
import SeatingActions from '@/pages/taim/components/seating-actions/SeatingActions'
import Modal from '@/components/ui/modal/Modal'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import { kitchenProgress } from '@/pages/taim/utils/orders'
import './Floor.scss'

/**
 * /taim/floor – every table and the open take-outs, for the Manager, Host
 * and Waiter, and for the Chef to look at ("View only": no buttons, and a
 * tap on a dining table or take-out shows its bill read-only). Tables are green (ready), yellow (needs cleaning), grey
 * (dining) or blue (dining, everything served); a take-out turns blue when
 * it's ready for pickup. A tap does what the person's role allows:
 *   ready table    → seat it (seatTable); a Waiter or Manager then goes to the order.
 *                    Not clean enough? "Needs cleaning" turns it yellow again.
 *   needs cleaning → "Mark as clean" (cleanTable)
 *   dining table   → its order (addDishes: Waiter, Manager) or its bill (Host),
 *                    where a seating mistake can be fixed (move, undo)
 *   take-out       → its order (takeoutOrders: Host too, who takes phone orders)
 * "Combine tables" (Host, Manager): pick free, clean tables, then "Set
 * tables" – they show as one card ("T1 + T4 + T7 · 10 seats") and are
 * seated and ordered for as one.
 */
const Floor = () => {
    const floor = useFloor()
    const { can, canEditDishes } = useStaff()
    const navigate = useNavigate()
    const now = useNow()
    // What the modal shows: { kind: 'seat' | 'clean', table } | { kind: 'takeout' } | { kind: 'table' } | { kind: 'bill', orderId }
    const [dialog, setDialog] = useState(null)
    const close = () => setDialog(null)
    // Combining tables: null = not choosing; otherwise the ids picked so far
    const [picked, setPicked] = useState(null)
    const [combineError, setCombineError] = useState('')
    const [combining, setCombining] = useState(false)

    // After seating or starting a take-out: whoever can take that order goes
    // straight to it (a Host seating a table stays on the floor)
    const afterSeat = (order) => {
        if (canEditDishes(order.type)) navigate(`/taim/order/${order.id}`)
    }

    const openOrder = (orderId, type) => {
        if (canEditDishes(type)) navigate(`/taim/order/${orderId}`)
        else setDialog({ kind: 'bill', orderId })
    }

    // Only free, clean, single tables can be combined
    const canPick = (table) => !table.order && !table.needsCleaning && table.joined.length === 0
    const togglePick = (table) =>
        setPicked((ids) => (ids.includes(table.id) ? ids.filter((id) => id !== table.id) : [...ids, table.id]))
    const stopCombining = () => { setPicked(null); setCombineError('') }

    const setTables = async () => {
        setCombining(true)
        setCombineError('')
        try {
            await floor.combineTables(picked)
            stopCombining()
        } catch (err) {
            setCombineError(err.message)
        } finally {
            setCombining(false)
        }
    }

    const handleTable = (table) => {
        if (picked) return canPick(table) && togglePick(table)
        if (table.order) openOrder(table.order.id, 'TABLE')
        else if (table.needsCleaning) setDialog({ kind: 'clean', table })
        else if (can('seatTable')) setDialog({ kind: 'seat', table })
    }

    if (floor.error && !floor.tables) {
        return (
            <div className="taim__notice surface d-flex flex-column gap-1 align-items-start" role="alert">
                <p>Couldn't load the floor: {floor.error}</p>
                <Button variant="secondary" onClick={floor.reload}>Try again</Button>
            </div>
        )
    }
    if (!floor.tables) return <p role="status">Loading the floor…</p>

    // Tables joined to another show inside their group's card
    const shown = floor.tables.filter((table) => !table.joinedToId)
    const taken = shown.filter((table) => table.order).length
    const toClean = shown.filter((table) => !table.order && table.needsCleaning).length
    const pickedTables = picked ? floor.tables.filter((table) => picked.includes(table.id)) : []
    const nextLabel = `T${floor.tables.length + 1}`
    // The Chef: sees everything, changes nothing
    const viewOnly = !['seatTable', 'cleanTable', 'combineTables', 'setUpTables'].some((right) => can(right))

    return (
        <div className="floor d-flex flex-column gap-2">
            <div className="d-flex flex-wrap align-items-center justify-between gap-1">
                <div className="d-flex flex-column">
                    <h2 className="taim__heading d-flex align-items-center gap-0-5">
                        Floor
                        {viewOnly && <span className="taim__view-only">View only</span>}
                    </h2>
                    <span className="form__hint">
                        {taken} of {shown.length} tables dining
                        {toClean > 0 && ` · ${toClean} to clean`} · {floor.takeouts.length} take-out
                        {floor.takeouts.length === 1 ? '' : 's'}
                    </span>
                </div>
                <div className="d-flex flex-wrap gap-0-5">
                    {can('combineTables') && !picked && (
                        <Button variant="ghost" onClick={() => setPicked([])}>Combine tables</Button>
                    )}
                    {can('setUpTables') && (
                        <Button variant="ghost" icon="IconPlus" onClick={() => setDialog({ kind: 'table' })}>Table</Button>
                    )}
                    {can('seatTable') && (
                        <Button icon="IconPlus" onClick={() => setDialog({ kind: 'takeout' })}>Take-out</Button>
                    )}
                </div>
            </div>

            {floor.error && <p className="form__error" role="alert">Couldn't refresh: {floor.error}</p>}

            {picked && (
                <div className="floor__combine surface d-flex flex-wrap align-items-center gap-1" role="region" aria-label="Combine tables">
                    <span className="floor__combine-text">
                        {pickedTables.length === 0
                            ? 'Tap the free tables to combine.'
                            : `${pickedTables.map((t) => t.label).join(' + ')} · ${pickedTables.reduce((sum, t) => sum + t.seats, 0)} seats`}
                    </span>
                    {combineError && <span className="form__error" role="alert">{combineError}</span>}
                    <span className="d-flex gap-0-5 ml-auto">
                        <Button variant="ghost" onClick={stopCombining} disabled={combining}>Cancel</Button>
                        <Button onClick={setTables} disabled={combining || pickedTables.length < 2}>
                            {combining ? 'Setting…' : 'Set tables'}
                        </Button>
                    </span>
                </div>
            )}

            <div className="d-flex flex-wrap align-items-start gap-2">
                <ul className="floor__tables" aria-label="Tables">
                    {shown.map((table) => (
                        <li key={table.id}>
                            <TableCard
                                table={table}
                                now={now}
                                onClick={() => handleTable(table)}
                                disabled={picked ? !canPick(table) : !table.order && !can(table.needsCleaning ? 'cleanTable' : 'seatTable')}
                                selected={picked ? picked.includes(table.id) : undefined}
                            />
                        </li>
                    ))}
                </ul>

                <section className="floor__takeouts surface d-flex flex-column gap-0-5" aria-labelledby="takeouts-title">
                    <h3 id="takeouts-title" className="floor__takeouts-title">Take-out</h3>
                    {floor.takeouts.length === 0 ? (
                        <p className="form__hint">No take-out orders.</p>
                    ) : (
                        <ul className="floor__takeout-list">
                            {floor.takeouts.map((order) => {
                                const progress = { dishCount: order.items.length, ...kitchenProgress(order.items) }
                                const ready = progress.dishCount > 0 && progress.notSent === 0 && progress.onHold === 0 && progress.inKitchen === 0
                                return (
                                    <li key={order.id}>
                                        <button
                                            type="button"
                                            className={`floor__takeout ${ready ? 'is-ready' : ''} d-flex justify-between gap-0-5`}
                                            onClick={() => openOrder(order.id, 'TAKEOUT')}
                                        >
                                            <span className="d-flex flex-column">
                                                <strong>{order.customerName}</strong>
                                                {order.customerPhone && <span className="form__hint">{order.customerPhone}</span>}
                                                <span className="form__hint">
                                                    {order.items.length} {order.items.length === 1 ? 'dish' : 'dishes'} · {minutesSince(order.openedAt, now)} min
                                                </span>
                                                <KitchenProgress order={progress} now={now} doneText="Ready for pickup" />
                                            </span>
                                            <span className="floor__takeout-total">{formatMoney(order.total)}</span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </section>
            </div>

            <Modal
                isOpen={dialog?.kind === 'seat' || dialog?.kind === 'takeout'}
                onClose={close}
                title={dialog?.kind === 'seat' ? `Seat ${dialog.table.groupLabel}` : 'New take-out'}
                size="sm"
            >
                {dialog?.kind === 'seat' && (
                    <SeatForm
                        // a combined group shows as one table: its label and seats
                        table={{ ...dialog.table, label: dialog.table.groupLabel, seats: dialog.table.groupSeats }}
                        onSave={async (guests) => afterSeat(await floor.seatTable(dialog.table.id, guests))}
                        onNeedsCleaning={can('cleanTable') ? () => floor.markNeedsCleaning(dialog.table.id) : undefined}
                        onSplit={can('combineTables') && dialog.table.joined.length > 0 ? () => floor.splitTables(dialog.table.id) : undefined}
                        onDone={close}
                    />
                )}
                {dialog?.kind === 'takeout' && (
                    <SeatForm table={null} onSave={async (data) => afterSeat(await floor.startTakeout(data))} onDone={close} />
                )}
            </Modal>

            <Modal isOpen={dialog?.kind === 'clean'} onClose={close} title={`${dialog?.table?.groupLabel ?? ''} needs cleaning`} size="sm">
                {dialog?.kind === 'clean' && (
                    <CleanDialog table={dialog.table} onClean={() => floor.cleanTable(dialog.table.id)} onDone={close} />
                )}
            </Modal>

            <Modal isOpen={dialog?.kind === 'table'} onClose={close} title="Add table" size="sm">
                {dialog?.kind === 'table' && <TableForm suggestedLabel={nextLabel} onSave={floor.createTable} onDone={close} />}
            </Modal>

            <Modal isOpen={dialog?.kind === 'bill'} onClose={close} title="Bill" size="sm">
                {dialog?.kind === 'bill' && (
                    <BillDialog
                        orderId={dialog.orderId}
                        canClose={can('closeBill')}
                        canFixSeating={can('seatTable')}
                        onChanged={floor.reload}
                        onGone={() => { floor.reload(); close() }}
                    />
                )}
            </Modal>
        </div>
    )
}

/**
 * The bill of one order in a dialog (for a Host, who can close it and fix
 * the seating but not add dishes). onGone: the bill was closed or the
 * seating undone; onChanged: moved or guests changed.
 */
const BillDialog = ({ orderId, canClose, canFixSeating, onChanged, onGone }) => {
    const { order, error, close, update, undo } = useOrder(orderId)
    if (error) return <p className="form__error" role="alert">{error}</p>
    if (!order) return <p role="status">Loading the bill…</p>
    return (
        <div className="d-flex flex-column gap-1">
            <Ticket order={order} className="floor__bill" onClose={canClose ? async () => { await close(); onGone() } : undefined} />
            {canFixSeating && order.status === 'OPEN' && (
                <SeatingActions
                    inDialog
                    order={order}
                    onUpdate={async (data) => { await update(data); onChanged() }}
                    onUndo={async () => { await undo(); onGone() }}
                />
            )}
        </div>
    )
}

/** "T3 needs cleaning" → Mark as clean (Host, Waiter, Manager) */
const CleanDialog = ({ table, onClean, onDone }) => {
    const { can } = useStaff()
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const clean = async () => {
        setBusy(true)
        try {
            await onClean()
            onDone()
        } catch (err) {
            setError(err.message)
            setBusy(false)
        }
    }

    return (
        <div className="d-flex flex-column gap-1">
            <p>
                The guests at {table.groupLabel} have left. Once {table.joined.length > 0 ? 'they are' : "it's"} cleaned
                and set, mark {table.joined.length > 0 ? 'them' : 'it'} ready for the next guests
                {table.joined.length > 0 && ' (the tables are split back up)'}.
            </p>
            {error && <p className="form__error" role="alert">{error}</p>}
            <div className="d-flex flex-wrap justify-end gap-0-5">
                <Button variant="ghost" onClick={onDone} disabled={busy}>Later</Button>
                {can('cleanTable') && <Button onClick={clean} disabled={busy}>{busy ? 'Saving…' : 'Mark as clean'}</Button>}
            </div>
        </div>
    )
}

export default Floor
