import { formatMoney } from '@/pages/taim/utils/money'
import { clockTime } from '@/pages/taim/utils/orders'
import './DayReport.scss'

/** "Fri 30 Oct" */
const dayName = (date) => new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

/** Same calendar day on this device? */
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()

/**
 * One closed day's end-of-day report, as it was saved at closing: when it
 * ran and who closed it, bills (tables / take-outs), guests, sales, average
 * bill, and what came back.
 *
 * @param {object} props
 * @param {object} props.day  A BusinessDay from the API.
 */
const DayReport = ({ day }) => (
    <article className="day-report d-flex flex-column gap-0-5" aria-label={`Day of ${dayName(day.openedAt)}`}>
        <header className="d-flex flex-wrap justify-between align-items-baseline gap-0-5">
            {/* Named after the day it started: Thursday's night closed at 04:00 Friday is Thursday */}
            <strong className="day-report__title">{dayName(day.openedAt)}</strong>
            <span className="form__hint">
                {clockTime(day.openedAt)} → {sameDay(day.openedAt, day.closedAt) ? '' : `${dayName(day.closedAt)} `}
                {clockTime(day.closedAt)} ·{' '}
                {day.closedBy ? `closed by ${day.closedBy.name}` : 'closed automatically'}
            </span>
        </header>
        <dl className="day-report__figures">
            <div>
                <dt>Sales</dt>
                <dd>{formatMoney(day.sales)}</dd>
            </div>
            <div>
                <dt>Bills</dt>
                <dd>{day.billCount}</dd>
            </div>
            <div>
                <dt>Average</dt>
                <dd>{formatMoney(day.billCount ? Math.round(day.sales / day.billCount) : 0)}</dd>
            </div>
            <div>
                <dt>Guests</dt>
                <dd>{day.guests}</dd>
            </div>
        </dl>
        <span className="form__hint">
            {day.tableBills} {day.tableBills === 1 ? 'table' : 'tables'} · {day.takeoutBills} take-out
            {day.takeoutBills === 1 ? '' : 's'}
            {day.cameBack > 0 && ` · ${day.cameBack} came back (${formatMoney(day.cameBackValue)})`}
        </span>
    </article>
)

export default DayReport
