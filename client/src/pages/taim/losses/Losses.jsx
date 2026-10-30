import { useMemo, useState } from 'react'
import { useLosses, summarize } from '@/pages/taim/hooks/useLosses'
import MonthBars from '@/pages/taim/components/month-bars/MonthBars'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/taim/utils/money'
import { reasonLabel, seatLabel, clockTime } from '@/pages/taim/utils/orders'
import './Losses.scss'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "Fri 30 Oct" */
const dayName = (date) => new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

/**
 * /taim/losses (Manager, Chef) – what dishes that came back cost. A year
 * chart of money lost per month; tap a month (this month to start) for its
 * total, top reasons, top dishes and every return: dish, table, seat,
 * reason, note, who, when, and the loss (the dish plus its free remake).
 * Tap the month again for the whole year.
 */
const Losses = () => {
    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth()) // null = the whole year
    const losses = useLosses(year)
    const isThisYear = year === now.getFullYear()

    const returns = losses.data?.returns
    const perMonth = useMemo(() => {
        const values = Array(12).fill(0)
        for (const row of returns ?? []) values[new Date(row.at).getMonth()] += row.value
        return values
    }, [returns])
    const shown = useMemo(
        () => (returns ?? []).filter((row) => month === null || new Date(row.at).getMonth() === month),
        [returns, month]
    )
    const summary = summarize(shown)
    const period = month === null ? `${year}` : `${MONTH_NAMES[month]} ${year}`

    const changeYear = (next) => {
        setYear(next)
        setMonth(next === now.getFullYear() ? now.getMonth() : null)
    }

    if (losses.error && !losses.data) {
        return (
            <div className="taim__notice surface d-flex flex-column gap-1 align-items-start" role="alert">
                <p>Couldn't load the losses: {losses.error}</p>
                <Button variant="secondary" onClick={losses.reload}>Try again</Button>
            </div>
        )
    }

    return (
        <div className="losses d-flex flex-column gap-2">
            <div className="d-flex flex-wrap align-items-center justify-between gap-1">
                <div className="d-flex flex-column">
                    <h2 className="taim__heading">Losses</h2>
                    <span className="form__hint">Dishes that came back, and their free remakes</span>
                </div>
                <div className="d-flex align-items-center gap-0-5" role="group" aria-label="Year">
                    <Button variant="ghost" size="sm" onClick={() => changeYear(year - 1)} aria-label="Previous year">‹ {year - 1}</Button>
                    <strong className="losses__year">{year}</strong>
                    <Button variant="ghost" size="sm" onClick={() => changeYear(year + 1)} disabled={isThisYear} aria-label="Next year">{year + 1} ›</Button>
                </div>
            </div>

            {!losses.data ? (
                <p role="status">Loading losses…</p>
            ) : (
                <>
                    <section className="losses__chart surface d-flex flex-column gap-1" aria-labelledby="chart-title">
                        <div className="d-flex flex-wrap justify-between align-items-baseline gap-0-5">
                            <h3 id="chart-title" className="losses__section-title">Money lost per month</h3>
                            <span className="form__hint">{formatMoney(losses.data.total)} in {year} · tap a month</span>
                        </div>
                        <MonthBars values={perMonth} selected={month} onSelect={setMonth} lastMonth={isThisYear ? now.getMonth() : 11} />
                    </section>

                    <dl className="losses__totals">
                        <div className="surface">
                            <dt>Lost · {period}</dt>
                            <dd className="losses__lost">{formatMoney(summary.total)}</dd>
                        </div>
                        <div className="surface">
                            <dt>Came back</dt>
                            <dd>{summary.count}</dd>
                        </div>
                        <div className="surface">
                            <dt>Made again</dt>
                            <dd>{summary.remakes}</dd>
                        </div>
                    </dl>

                    {summary.count === 0 ? (
                        <p className="form__hint">Nothing came back in {period}.</p>
                    ) : (
                        <>
                            <div className="losses__groups">
                                <Ranking title="By reason" rows={summary.byReason.map((g) => ({ ...g, label: reasonLabel(g.key) }))} total={summary.total} />
                                <Ranking title="By dish" rows={summary.byDish.map((g) => ({ ...g, label: g.key }))} total={summary.total} />
                            </div>

                            <section className="d-flex flex-column gap-1" aria-labelledby="returns-title">
                                <h3 id="returns-title" className="losses__section-title">Every return · {period}</h3>
                                <ul className="losses__returns surface">
                                    {shown.map((row) => (
                                        <li key={row.id} className="losses__return d-flex justify-between align-items-start gap-1">
                                            <span className="d-flex flex-column">
                                                <strong>
                                                    {row.name} · {reasonLabel(row.reason)}
                                                </strong>
                                                {row.note && <span className="losses__note">"{row.note}"</span>}
                                                <span className="form__hint">
                                                    {dayName(row.at)} {clockTime(row.at)} · {row.title}
                                                    {row.title.startsWith('Take-out') ? '' : ` · ${seatLabel(row.seat)}`} · {row.by}
                                                    {row.remakePrice !== null ? ' · made again' : ''}
                                                </span>
                                            </span>
                                            <span className="losses__value">{formatMoney(row.value)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </>
                    )}
                </>
            )}
        </div>
    )
}

/** "By reason" / "By dish": a bar per row, its share of the loss */
const Ranking = ({ title, rows, total }) => (
    <section className="losses__ranking surface d-flex flex-column gap-0-5" aria-label={title}>
        <h3 className="losses__section-title">{title}</h3>
        <ul className="losses__rank-list">
            {rows.map((row) => (
                <li key={row.key} className="d-flex flex-column">
                    <span className="d-flex justify-between gap-0-5">
                        <span>
                            {row.label} <span className="form__hint">× {row.count}</span>
                        </span>
                        <span className="losses__value">{formatMoney(row.value)}</span>
                    </span>
                    <span className="losses__rank-bar" style={{ width: `${(row.value / total) * 100}%` }} />
                </li>
            ))}
        </ul>
    </section>
)

export default Losses
