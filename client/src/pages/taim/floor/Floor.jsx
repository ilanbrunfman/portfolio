import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { useFloor } from '@/pages/taim/hooks/useFloor'
import { useOrder } from '@/pages/taim/hooks/useOrder'
import { useNow, minutesSince } from '@/pages/taim/hooks/useNow'
import TableCard from '@/pages/taim/components/table-card/TableCard'
import SeatForm from '@/pages/taim/components/seat-form/SeatForm'
import TableForm from '@/pages/taim/components/table-form/TableForm'
import Ticket from '@/pages/taim/components/ticket/Ticket'
import Modal from '@/components/ui/modal/Modal'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import './Floor.scss'

/**
 * /taim/floor – every table (free or taken) and the open take-outs, for the
 * Manager, Host and Waiter. A tap does what the person's role allows:
 *   free table  → seat it (seatTable); a Waiter or Manager then goes to the order
 *   taken table → its order (addDishes: Waiter, Manager) or its bill (Host)
 */
const Floor = () => {
    const floor = useFloor()
    const { can } = useStaff()
    const navigate = useNavigate()
    const now = useNow()
    // What the modal shows: { kind: 'seat', table } | { kind: 'takeout' } | { kind: 'table' } | { kind: 'bill', orderId }
    const [dialog, setDialog] = useState(null)
    const close = () => setDialog(null)

    // After seating: a Waiter or Manager takes the order straight away
    const afterSeat = (order) => {
        if (can('addDishes')) navigate(`/taim/order/${order.id}`)
    }

    const openOrder = (orderId) => {
        if (can('addDishes')) navigate(`/taim/order/${orderId}`)
        else setDialog({ kind: 'bill', orderId })
    }

    const handleTable = (table) => {
        if (table.order) openOrder(table.order.id)
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

    const taken = floor.tables.filter((table) => table.order).length
    const nextLabel = `T${floor.tables.length + 1}`

    return (
        <div className="floor d-flex flex-column gap-2">
            <div className="d-flex flex-wrap align-items-center justify-between gap-1">
                <div className="d-flex flex-column">
                    <h2 className="taim__heading">Floor</h2>
                    <span className="form__hint">
                        {taken} of {floor.tables.length} tables taken · {floor.takeouts.length} take-out
                        {floor.takeouts.length === 1 ? '' : 's'}
                    </span>
                </div>
                <div className="d-flex flex-wrap gap-0-5">
                    {can('setUpTables') && (
                        <Button variant="ghost" icon="IconPlus" onClick={() => setDialog({ kind: 'table' })}>Table</Button>
                    )}
                    {can('seatTable') && (
                        <Button icon="IconPlus" onClick={() => setDialog({ kind: 'takeout' })}>Take-out</Button>
                    )}
                </div>
            </div>

            {floor.error && <p className="form__error" role="alert">Couldn't refresh: {floor.error}</p>}

            <div className="d-flex flex-wrap align-items-start gap-2">
                <ul className="floor__tables" aria-label="Tables">
                    {floor.tables.map((table) => (
                        <li key={table.id}>
                            <TableCard
                                table={table}
                                now={now}
                                onClick={() => handleTable(table)}
                                disabled={!table.order && !can('seatTable')}
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
                            {floor.takeouts.map((order) => (
                                <li key={order.id}>
                                    <button type="button" className="floor__takeout d-flex justify-between gap-0-5" onClick={() => openOrder(order.id)}>
                                        <span className="d-flex flex-column">
                                            <strong>{order.customerName}</strong>
                                            <span className="form__hint">
                                                {order.items.length} {order.items.length === 1 ? 'dish' : 'dishes'} · {minutesSince(order.openedAt, now)} min
                                            </span>
                                        </span>
                                        <span className="floor__takeout-total">{formatMoney(order.total)}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <Modal
                isOpen={dialog?.kind === 'seat' || dialog?.kind === 'takeout'}
                onClose={close}
                title={dialog?.kind === 'seat' ? `Seat ${dialog.table.label}` : 'New take-out'}
                size="sm"
            >
                {dialog?.kind === 'seat' && (
                    <SeatForm
                        table={dialog.table}
                        onSave={async (guests) => afterSeat(await floor.seatTable(dialog.table.id, guests))}
                        onDone={close}
                    />
                )}
                {dialog?.kind === 'takeout' && (
                    <SeatForm table={null} onSave={async (name) => afterSeat(await floor.startTakeout(name))} onDone={close} />
                )}
            </Modal>

            <Modal isOpen={dialog?.kind === 'table'} onClose={close} title="Add table" size="sm">
                {dialog?.kind === 'table' && <TableForm suggestedLabel={nextLabel} onSave={floor.createTable} onDone={close} />}
            </Modal>

            <Modal isOpen={dialog?.kind === 'bill'} onClose={close} title="Bill" size="sm">
                {dialog?.kind === 'bill' && (
                    <BillDialog orderId={dialog.orderId} canClose={can('closeBill')} onClosed={() => { floor.reload(); close() }} />
                )}
            </Modal>
        </div>
    )
}

/** The bill of one order in a dialog (for a Host, who can close it but not add dishes) */
const BillDialog = ({ orderId, canClose, onClosed }) => {
    const { order, error, close } = useOrder(orderId)
    if (error) return <p className="form__error" role="alert">{error}</p>
    if (!order) return <p role="status">Loading the bill…</p>
    return (
        <Ticket
            order={order}
            className="floor__bill"
            onClose={canClose ? async () => { await close(); onClosed() } : undefined}
        />
    )
}

export default Floor
