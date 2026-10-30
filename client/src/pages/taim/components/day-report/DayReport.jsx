import { formatMoney } from '@/pages/taim/utils/money'
import { clockTime } from '@/pages/taim/utils/orders'
import './DayReport.scss'

/** "Fri 30 Oct" */
const dayName = (date) => new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

/**
 * One closed day's end-of-day report, as it was saved at closing: when it
 * ran and who closed it, bills (tables / take-outs), guests, sales, average
 * bill, and what came back.
 *
 * @param {object} props
 * @param {object} props.day  A BusinessDay from the API.
 */
const DayReport = ({ day }) => (
    <article className="day-report d-flex flex-column gap-0-5" aria-label={`Day closed ${dayName(day.closedAt)}`}>
        <header className="d-flex flex-wrap justify-between align-items-baseline gap-0-5">
            <strong className="day-report__title">{dayName(day.closedAt)}</strong>
            <span className="form__hint">
                {dayName(day.openedAt)} {clockTime(day.openedAt)} → {clockTime(day.closedAt)} · closed by {day.closedBy.name}
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
