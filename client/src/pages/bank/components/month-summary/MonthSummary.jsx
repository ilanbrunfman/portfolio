import { useEffect, useState } from 'react'
import { useBank } from '@/pages/bank/context/BankContext'
import { api } from '@/pages/bank/api/client'
import Button from '@/components/ui/button/Button'
import { formatMoney } from '@/pages/bank/utils/money'
import { addMonths, currentMonth, formatMonth } from '@/pages/bank/utils/date'
import './MonthSummary.scss'

/**
 * One month at a glance (GET /api/summary): income, spending and net,
 * spending by category, and a 6-month income vs spending chart.
 * Transfers between your own accounts don't count as either.
 */
const MonthSummary = () => {
    const { accounts } = useBank()
    const thisMonth = currentMonth()
    const [month, setMonth] = useState(thisMonth)
    const [result, setResult] = useState({ summary: null, month: null, error: null })

    // Re-fetch when the month changes, and when accounts change (a new
    // transaction or an archived account changes the numbers)
    useEffect(() => {
        let cancelled = false
        api(`/summary?month=${month}`)
            .then((summary) => !cancelled && setResult({ summary, month, error: null }))
            .catch((err) => !cancelled && setResult((prev) => ({ ...prev, month, error: err.message })))
        return () => { cancelled = true }
    }, [month, accounts])

    const { summary, error } = result
    const stale = result.month !== month // still showing the previous month

    const header = (
        <div className="d-flex justify-between align-items-center gap-1">
            <h2 className="month-summary__title">{formatMonth(month)}</h2>
            <div className="d-flex gap-0-5">
                <Button variant="ghost" size="sm" icon="IconArrowLeft" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} />
                <Button
                    variant="ghost"
                    size="sm"
                    icon="IconChevronRight"
                    aria-label="Next month"
                    onClick={() => setMonth(addMonths(month, 1))}
                    disabled={month >= thisMonth}
                />
            </div>
        </div>
    )

    if (!summary) {
        return (
            <section className="month-summary surface d-flex flex-column gap-1" aria-label="Monthly summary">
                {header}
                {error ? <p className="form__error" role="alert">{error}</p> : <p>Loading summary…</p>}
            </section>
        )
    }

    const biggest = summary.byCategory[0]?.total ?? 0
    const chartMax = Math.max(1, ...summary.trend.flatMap((t) => [t.income, t.spent]))

    return (
        <section className="month-summary surface d-flex flex-column gap-2" aria-label="Monthly summary" aria-busy={stale}>
            {header}
            {error && <p className="form__error" role="alert">{error}</p>}

            <div className={`d-flex flex-column gap-2 ${stale ? 'is-stale' : ''}`}>
                <dl className="month-summary__stats d-grid grid-1 grid-sm-3 gap-0-5 gap-sm-1">
                    <div className="d-flex justify-between align-items-center flex-sm-column align-items-sm-start">
                        <dt>Income</dt>
                        <dd className="is-in">{formatMoney(summary.income)}</dd>
                    </div>
                    <div className="d-flex justify-between align-items-center flex-sm-column align-items-sm-start">
                        <dt>Spent</dt>
                        <dd>{formatMoney(summary.spent)}</dd>
                    </div>
                    <div className="d-flex justify-between align-items-center flex-sm-column align-items-sm-start">
                        <dt>Net</dt>
                        <dd className={summary.net < 0 ? 'is-out' : 'is-in'}>
                            {summary.net > 0 ? '+' : ''}{formatMoney(summary.net)}
                        </dd>
                    </div>
                </dl>

                <div className="d-grid grid-7-5 gap-2">
                    {/* 6-month chart: each month is a button that selects it */}
                    <div className="d-flex flex-column gap-0-5">
                        <h3 className="month-summary__heading">Last 6 months</h3>
                        <div className="month-summary__chart d-flex align-items-end gap-0-5" aria-hidden="true">
                            {summary.trend.map((t) => (
                                <button
                                    key={t.month}
                                    type="button"
                                    tabIndex={-1}
                                    className={`month-summary__column d-flex flex-column align-items-center gap-0-5 ${t.month === month ? 'is-selected' : ''}`}
                                    onClick={() => setMonth(t.month)}
                                    title={`${formatMonth(t.month)}: in ${formatMoney(t.income)}, spent ${formatMoney(t.spent)}`}
                                >
                                    <span className="month-summary__bars d-flex align-items-end">
                                        <span className="month-summary__bar is-in" style={{ height: `${(t.income / chartMax) * 100}%` }} />
                                        <span className="month-summary__bar is-out" style={{ height: `${(t.spent / chartMax) * 100}%` }} />
                                    </span>
                                    <span className="month-summary__label">{formatMonth(t.month, { short: true })}</span>
                                </button>
                            ))}
                        </div>
                        <div className="month-summary__legend d-flex gap-1">
                            <span className="is-in">Income</span>
                            <span className="is-out">Spent</span>
                        </div>
                        {/* The same numbers for screen readers */}
                        <table className="sr-only">
                            <caption>Income and spending, last 6 months</caption>
                            <thead>
                                <tr><th>Month</th><th>Income</th><th>Spent</th></tr>
                            </thead>
                            <tbody>
                                {summary.trend.map((t) => (
                                    <tr key={t.month}>
                                        <td>{formatMonth(t.month)}</td>
                                        <td>{formatMoney(t.income)}</td>
                                        <td>{formatMoney(t.spent)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Spending by category, biggest first */}
                    <div className="d-flex flex-column gap-0-5">
                        <h3 className="month-summary__heading">Spending by category</h3>
                        {summary.byCategory.length === 0 ? (
                            <p>No spending this month.</p>
                        ) : (
                            <ul className="month-summary__categories d-flex flex-column gap-0-5">
                                {summary.byCategory.map((c) => (
                                    <li key={c.categoryId ?? 'none'} className="d-flex flex-column gap-0-5" style={{ '--bar': c.color ?? 'var(--text)' }}>
                                        <span className="d-flex justify-between gap-1">
                                            <span>{c.name}</span>
                                            <span className="month-summary__amount">
                                                {formatMoney(c.total)}
                                                <span className="month-summary__share"> · {Math.round((c.total / summary.spent) * 100)}%</span>
                                            </span>
                                        </span>
                                        <span className="month-summary__track" aria-hidden="true">
                                            <span className="month-summary__fill" style={{ width: `${(c.total / biggest) * 100}%` }} />
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default MonthSummary
