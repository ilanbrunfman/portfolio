import { useMemo, useState } from 'react'
import { useLosses, summarize } from '@/pages/taim/hooks/useLosses'
import MonthBars from '@/pages/taim/components/month-bars/MonthBars'
import Button from '@/components/ui/button/Button'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import { formatMoney } from '@/pages/taim/utils/money'
import { reasonLabel, seatLabel, clockTime } from '@/pages/taim/utils/orders'
import './Losses.scss'

const KINDS = [
    { value: 'ALL', label: 'All' },
    { value: 'RETURN', label: 'Returns' },
    { value: 'WASTE', label: 'Waste' },
    { value: 'FIX', label: 'Fixes' },
]

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "Fri 30 Oct" */
const dayName = (date) => new Date(date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

/**
 * /taim/losses (Manager, Chef) – what lost dishes cost: returns (a guest
 * gave it back; the loss is the dish plus the free dish given instead) and
 * waste (cancelled after cooking started, dropped, made wrong) – plus fixes
 * (sent back to be fixed: no money lost, so the chart counts them). All /
 * Returns / Waste / Fixes filters everything below. A year chart of money lost per
 * month; tap a month (this month to start) for its total, top reasons, top
 * dishes and every loss: dish, table, seat, reason, note, who, when. Tap the
 * month again for the whole year.
 */
const Losses = () => {
    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth()) // null = the whole year
    const [kind, setKind] = useState('ALL')
    const losses = useLosses(year)
    const isThisYear = year === now.getFullYear()

    const all = losses.data?.returns
    const returns = useMemo(() => (all ?? []).filter((row) => kind === 'ALL' || row.kind === kind), [all, kind])
    // Fixes cost nothing: count them instead
    const counting = kind === 'FIX'
    const perMonth = useMemo(() => {
        const values = Array(12).fill(0)
        for (const row of returns) values[new Date(row.at).getMonth()] += counting ? 1 : row.value
        return values
    }, [returns, counting])
    const shown = useMemo(
        () => returns.filter((row) => month === null || new Date(row.at).getMonth() === month),
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
                    <span className="form__hint">Dishes that came back (and the free dishes given instead) and waste</span>
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
                    <RadioGroup label="Show" options={KINDS} value={kind} onChange={setKind} direction="row" className="losses__kinds" />
                    <section className="losses__chart surface d-flex flex-column gap-1" aria-labelledby="chart-title">
                        <div className="d-flex flex-wrap justify-between align-items-baseline gap-0-5">
                            <h3 id="chart-title" className="losses__section-title">{counting ? 'Fixes per month' : 'Money lost per month'}</h3>
                            <span className="form__hint">
                                {counting
                                    ? `${losses.data.fixes} ${losses.data.fixes === 1 ? 'fix' : 'fixes'} in ${year} (no money lost)`
                                    : `${formatMoney(perMonth.reduce((sum, value) => sum + value, 0))} in ${year} · returns ${formatMoney(losses.data.returnsTotal)} · waste ${formatMoney(losses.data.wasteTotal)} · ${losses.data.fixes} ${losses.data.fixes === 1 ? 'fix' : 'fixes'}`}
                                {' '}· tap a month
                            </span>
                        </div>
                        <MonthBars
                            values={perMonth}
                            selected={month}
                            onSelect={setMonth}
                            lastMonth={isThisYear ? now.getMonth() : 11}
                            format={counting ? (value) => String(value) : undefined}
                        />
                    </section>

                    <dl className="losses__totals">
                        <div className="surface">
                            <dt>Lost · {period}</dt>
                            <dd className="losses__lost">{formatMoney(summary.total)}</dd>
                        </div>
                        <div className="surface">
                            <dt>{{ ALL: 'Sent back or lost', RETURN: 'Came back', WASTE: 'Wasted', FIX: 'Fixed' }[kind]}</dt>
                            <dd>{summary.count}</dd>
                        </div>
                        <div className="surface">
                            <dt>Given free instead</dt>
                            <dd>{summary.remakes}</dd>
                        </div>
                    </dl>

                    {summary.count === 0 ? (
                        <p className="form__hint">Nothing {{ WASTE: 'wasted', RETURN: 'came back', FIX: 'sent back to fix', ALL: 'lost' }[kind]} in {period}.</p>
                    ) : (
                        <>
                            <div className="losses__groups">
                                <Ranking title="By reason" rows={summary.byReason.map((g) => ({ ...g, label: reasonLabel(g.key) }))} total={summary.total} />
                                <Ranking title="By dish" rows={summary.byDish.map((g) => ({ ...g, label: g.key }))} total={summary.total} />
                            </div>

                            <section className="d-flex flex-column gap-1" aria-labelledby="returns-title">
                                <h3 id="returns-title" className="losses__section-title">Every loss · {period}</h3>
                                <ul className="losses__returns surface">
                                    {shown.map((row) => (
                                        <li key={row.id} className="losses__return d-flex justify-between align-items-start gap-1">
                                            <span className="d-flex flex-column">
                                                <strong>
                                                    {row.name} · {reasonLabel(row.reason)}
                                                    <span className={`losses__kind is-${row.kind.toLowerCase()}`}>{{ RETURN: 'Return', WASTE: 'Waste', FIX: 'Fix' }[row.kind]}</span>
                                                </strong>
                                                {row.note && <span className="losses__note">"{row.note}"</span>}
                                                <span className="form__hint">
                                                    {dayName(row.at)} {clockTime(row.at)} · {row.title}
                                                    {row.title.startsWith('Take-out') ? '' : ` · ${seatLabel(row.seat)}`} · {row.by}
                                                    {row.remakePrice !== null ? (row.remakeName ? ` · ${row.remakeName} instead (free)` : ' · made again (free)') : ''}
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
