import { formatMoney } from '@/pages/taim/utils/money'
import './MonthBars.scss'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Money lost per month for a year, as twelve bars (taller = more lost).
 * Each bar is a button: tap a month to see its detail, tap it again for
 * the whole year. Months still to come are dimmed.
 *
 * @param {object} props
 * @param {number[]} props.values           Twelve amounts in cents, Jan → Dec.
 * @param {number|null} props.selected      The picked month (0–11), or null for the whole year.
 * @param {(month: number|null) => void} props.onSelect
 * @param {number} [props.lastMonth=11]     The last month that has happened (later ones are dimmed).
 */
const MonthBars = ({ values, selected, onSelect, lastMonth = 11 }) => {
    const max = Math.max(...values, 1)
    return (
        <div className="month-bars" role="group" aria-label="Money lost per month">
            {values.map((value, month) => (
                <button
                    key={MONTHS[month]}
                    type="button"
                    className={`month-bars__month d-flex flex-column align-items-center justify-end gap-0-5 ${selected === month ? 'is-selected' : ''} ${month > lastMonth ? 'is-future' : ''}`}
                    onClick={() => onSelect(selected === month ? null : month)}
                    aria-pressed={selected === month}
                    aria-label={`${MONTHS[month]}: ${formatMoney(value)} lost`}
                >
                    <span className="month-bars__value">{value > 0 ? formatMoney(value).replace(/\.00$/, '') : ''}</span>
                    <span className="month-bars__bar" style={{ height: `${Math.max(value > 0 ? 4 : 2, (value / max) * 100)}%` }} />
                    <span className="month-bars__label">{MONTHS[month]}</span>
                </button>
            ))}
        </div>
    )
}

export default MonthBars
