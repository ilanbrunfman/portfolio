import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStaff } from '@/pages/taim/context/StaffContext'
import { useBills, periodStart } from '@/pages/taim/hooks/useBills'
import { useOrder } from '@/pages/taim/hooks/useOrder'
import Ticket from '@/pages/taim/components/ticket/Ticket'
import DayReport from '@/pages/taim/components/day-report/DayReport'
import Tabs from '@/components/ui/tabs/Tabs'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Modal from '@/components/ui/modal/Modal'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import { clockTime } from '@/pages/taim/utils/orders'
import './Bills.scss'

const PERIODS = [
    { id: 'today', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
]
const STATUSES = [
    { value: 'ALL', label: 'All' },
    { value: 'OPEN', label: 'Open' },
    { value: 'CLOSED', label: 'Closed' },
]

/** "Thu 29 Oct" */
const dayName = (date) => new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

/** What the period covers, under the heading */
function periodText(period, since) {
    if (period !== 'today') return `Since ${dayName(periodStart(period))}`
    return since ? `Since the last close: ${dayName(since)} ${clockTime(since)}` : 'Every bill so far: the day was never closed'
}

/**
 * /taim/bills – every bill of today (since the last close), this week,
 * month or year, for the Manager, Chef and Host: totals on top (sales of
 * closed bills, bills, average bill, guests), All / Open / Closed, and the
 * list. A tap on an open bill you may edit (the Manager; the Host for a
 * take-out) opens it on the Order screen; any other bill shows read-only. On "Day" the Manager and Chef
 * close the day: refused while bills are open; it saves the end-of-day
 * report and locks the day's bills. If nobody does, the server closes it at
 * the set time (04:00); a warning shows while open bills hold that back. Week, month and year also list the
 * days closed in them, with their reports.
 */
const Bills = () => {
    const { can, canEditDishes } = useStaff()
    const navigate = useNavigate()
    // An open bill you may edit goes to the Order screen; the rest show read-only
    const editable = (bill) => bill.status === 'OPEN' && canEditDishes(bill.type)
    const openBill = (bill) => (editable(bill) ? navigate(`/taim/order/${bill.id}`) : setViewing(bill.id))
    const [period, setPeriod] = useState('today')
    const [status, setStatus] = useState('ALL')
    const bills = useBills(period, status)
    const [viewing, setViewing] = useState(null) // bill id shown in the dialog

    return (
        <div className="bills d-flex flex-column gap-2">
            <div className="d-flex flex-column">
                <h2 className="taim__heading">Bills</h2>
                <span className="form__hint">{bills.data ? periodText(period, bills.data.since) : ' '}</span>
            </div>

            <Tabs label="Period" items={PERIODS} value={period} onChange={setPeriod}>
                {() =>
                    bills.error && !bills.data ? (
                        <div className="taim__notice surface d-flex flex-column gap-1 align-items-start" role="alert">
                            <p>Couldn't load the bills: {bills.error}</p>
                            <Button variant="secondary" onClick={bills.reload}>Try again</Button>
                        </div>
                    ) : !bills.data ? (
                        <p role="status">Loading bills…</p>
                    ) : (
                        <div className="d-flex flex-column gap-2">
                            <Totals totals={bills.data.totals} />

                            {period === 'today' && bills.data.autoClose?.due && (
                                <p className="bills__overdue" role="status">
                                    {bills.data.autoClose.waiting > 0
                                        ? `The day should have closed at ${bills.data.autoClose.at}: ${bills.data.autoClose.waiting} ${bills.data.autoClose.waiting === 1 ? 'bill from before then is' : 'bills from before then are'} still open. It closes by itself once ${bills.data.autoClose.waiting === 1 ? "it's" : "they're"} closed.`
                                        : `The day ended at ${bills.data.autoClose.at}: it closes by itself within 15 minutes.`}
                                </p>
                            )}

                            {period === 'today' && can('closeDay') && (
                                <CloseDay open={bills.data.totals.open} count={bills.data.totals.bills} autoAt={bills.data.autoClose?.at} onClose={bills.closeDay} />
                            )}

                            <section className="d-flex flex-column gap-1" aria-labelledby="bills-list-title">
                                <div className="d-flex flex-wrap align-items-center justify-between gap-1">
                                    <h3 id="bills-list-title" className="bills__section-title">Bills</h3>
                                    <RadioGroup label="Show" options={STATUSES} value={status} onChange={setStatus} direction="row" className="bills__filter" />
                                </div>
                                {bills.data.bills.length === 0 ? (
                                    <p className="form__hint">No {status === 'ALL' ? '' : `${status.toLowerCase()} `}bills in this period.</p>
                                ) : (
                                    <ul className="bills__list surface">
                                        {bills.data.bills.map((bill) => (
                                            <li key={bill.id}>
                                                <BillRow bill={bill} withDate={period !== 'today'} toOrder={editable(bill)} onOpen={() => openBill(bill)} />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {bills.data.more > 0 && <p className="form__hint">…and {bills.data.more} older bills (in the totals).</p>}
                            </section>

                            {period !== 'today' && (
                                <section className="d-flex flex-column gap-1" aria-labelledby="days-title">
                                    <h3 id="days-title" className="bills__section-title">Closed days</h3>
                                    {bills.data.days.length === 0 ? (
                                        <p className="form__hint">No day was closed in this period.</p>
                                    ) : (
                                        <ul className="bills__days">
                                            {bills.data.days.map((day) => (
                                                <li key={day.id} className="surface">
                                                    <DayReport day={day} />
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            )}
                        </div>
                    )
                }
            </Tabs>

            <Modal isOpen={viewing !== null} onClose={() => setViewing(null)} title="Bill" size="sm">
                {viewing !== null && <BillView orderId={viewing} />}
            </Modal>
        </div>
    )
}

/** Sales, bills, average bill, guests */
const Totals = ({ totals }) => (
    <dl className="bills__totals">
        <div className="surface">
            <dt>Sales</dt>
            <dd>{formatMoney(totals.sales)}</dd>
            <span className="form__hint">closed bills</span>
        </div>
        <div className="surface">
            <dt>Bills</dt>
            <dd>{totals.bills}</dd>
            <span className="form__hint">{totals.open > 0 ? `${totals.open} open` : 'all closed'}</span>
        </div>
        <div className="surface">
            <dt>Average bill</dt>
            <dd>{formatMoney(totals.averageBill)}</dd>
            <span className="form__hint">{totals.tableBills} tables · {totals.takeoutBills} take-out</span>
        </div>
        <div className="surface">
            <dt>Guests</dt>
            <dd>{totals.guests}</dd>
            <span className="form__hint">at tables</span>
        </div>
    </dl>
)

/**
 * One bill in the list: title, status, times, who opened it, dishes, total.
 * toOrder: the tap opens it on the Order screen ("Open in Order →").
 */
const BillRow = ({ bill, withDate, toOrder, onOpen }) => (
    <button
        type="button"
        className="bills__row d-flex align-items-center justify-between gap-1"
        onClick={onOpen}
        aria-label={`${bill.title}, ${bill.status === 'OPEN' ? 'open' : 'closed'}, ${formatMoney(bill.total)}. ${toOrder ? 'Open in Order' : 'Show the bill'}`}
    >
        <span className="d-flex flex-column">
            <span className="d-flex flex-wrap align-items-center gap-0-5">
                <strong className="bills__title">{bill.title}</strong>
                <span className={`bills__status ${bill.status === 'OPEN' ? 'is-open' : 'is-closed'}`}>{bill.status === 'OPEN' ? 'Open' : 'Closed'}</span>
            </span>
            <span className="form__hint">
                {withDate && `${dayName(bill.openedAt)} · `}
                {clockTime(bill.openedAt)}
                {bill.closedAt && ` → ${clockTime(bill.closedAt)}`} · {bill.openedBy.name} · {bill.dishCount} {bill.dishCount === 1 ? 'dish' : 'dishes'}
                {bill.guests ? ` · ${bill.guests} ${bill.guests === 1 ? 'guest' : 'guests'}` : ''}
            </span>
        </span>
        <span className="d-flex flex-column align-items-end">
            <span className="bills__total">{formatMoney(bill.total)}</span>
            {toOrder && <span className="bills__to-order">Open in Order →</span>}
        </span>
    </button>
)

/** A bill, read-only */
const BillView = ({ orderId }) => {
    const { order, error } = useOrder(orderId)
    if (error) return <p className="form__error" role="alert">{error}</p>
    if (!order) return <p role="status">Loading the bill…</p>
    return <Ticket order={order} className="bills__ticket" />
}

/**
 * "Close the day" (Manager, Chef): asks once, then saves the report and
 * shows it. While bills are open it says so instead (the server refuses too).
 */
const CloseDay = ({ open, count, autoAt, onClose }) => {
    const [state, setState] = useState('idle') // 'idle' | 'confirm' | 'busy'
    const [error, setError] = useState('')
    const [closed, setClosed] = useState(null) // the saved report

    const close = async () => {
        setState('busy')
        setError('')
        try {
            setClosed(await onClose())
        } catch (err) {
            setError(err.message)
        } finally {
            setState('idle')
        }
    }

    if (closed) {
        return (
            <section className="bills__close surface d-flex flex-column gap-1" aria-label="Day closed">
                <span className="bills__close-done">Day closed: its bills are locked</span>
                <DayReport day={closed} />
                <div className="d-flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setClosed(null)}>Done</Button>
                </div>
            </section>
        )
    }

    return (
        <section className="bills__close surface d-flex flex-wrap align-items-center justify-between gap-1" aria-label="Close the day">
            <span className="d-flex flex-column">
                <strong className="bills__close-title">End of the day</strong>
                <span className="form__hint">
                    {open > 0
                        ? `${open} ${open === 1 ? 'bill is' : 'bills are'} still open: close ${open === 1 ? 'it' : 'them'} first.`
                        : count === 0
                            ? 'No bills since the last close.'
                            : `Saves the day's report and locks its ${count} ${count === 1 ? 'bill' : 'bills'}.`}
                </span>
                {autoAt && <span className="form__hint">If nobody does, it closes by itself at {autoAt}.</span>}
                {error && <span className="form__error" role="alert">{error}</span>}
            </span>
            {state === 'confirm' || state === 'busy' ? (
                <span className="d-flex flex-wrap gap-0-5">
                    <Button onClick={close} disabled={state === 'busy'}>{state === 'busy' ? 'Closing…' : 'Yes, close the day'}</Button>
                    <Button variant="ghost" onClick={() => setState('idle')} disabled={state === 'busy'}>Not yet</Button>
                </span>
            ) : (
                <Button variant="secondary" onClick={() => setState('confirm')} disabled={open > 0 || count === 0}>Close the day</Button>
            )}
        </section>
    )
}

export default Bills
