import { useEffect, useState } from 'react'
import VersionChanges from '@/pages/taim/components/version-changes/VersionChanges'
import { formatMoney } from '@/pages/taim/utils/money'
import { periodLabel } from '@/pages/taim/utils/versions'
import './VersionCompare.scss'

const ROWS = [
    { key: 'perDay', label: 'Income per day', money: true },
    { key: 'averageBill', label: 'Average bill', money: true },
    { key: 'bills', label: 'Bills per day', perDay: true },
    // Menus run for different lengths: the total isn't better or worse, just more
    { key: 'income', label: 'Income in total', money: true, neutral: true },
    { key: 'returnRate', label: 'Came back', suffix: '%', lowerIsBetter: true },
]

/** A row's value for a version ("bills per day" from bills and days) */
const valueOf = (stats, row) => (row.perDay ? Math.round((stats[row.key] / stats.days) * 10) / 10 : stats[row.key])

/**
 * Two menu versions side by side: income per day, average bill, bills per
 * day, total income, returns – with the difference (green when the newer
 * one did better; the total stays plain, as menus run for different lengths) – and the dish changes from the older to the newer one.
 * Meant to sit inside a <Modal>.
 *
 * @param {object} props
 * @param {object} props.older     A version from GET /menu/versions (with stats).
 * @param {object} props.newer
 * @param {(from: number, to: number) => Promise<object[]>} props.loadChanges  useMenuVersions().compare
 */
const VersionCompare = ({ older, newer, loadChanges }) => {
    const [changes, setChanges] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        loadChanges(older.id, newer.id)
            .then((list) => { if (!cancelled) setChanges(list) })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [older.id, newer.id, loadChanges])

    const show = (row, value) => (row.money ? formatMoney(value) : `${value}${row.suffix ?? ''}`)
    const both = older.stats && newer.stats

    return (
        <div className="version-compare d-flex flex-column gap-1">
            <table className="version-compare__table">
                <thead>
                    <tr>
                        <th scope="col"><span className="sr-only">Figure</span></th>
                        {[older, newer].map((v) => (
                            <th key={v.id} scope="col">
                                <span className="version-compare__name">{v.name}</span>
                                <span className="version-compare__period">{periodLabel(v)}</span>
                            </th>
                        ))}
                        <th scope="col">Change</th>
                    </tr>
                </thead>
                <tbody>
                    {both && ROWS.map((row) => {
                        const a = valueOf(older.stats, row)
                        const b = valueOf(newer.stats, row)
                        const diff = Math.round((b - a) * 10) / 10
                        const better = row.lowerIsBetter ? diff < 0 : diff > 0
                        return (
                            <tr key={row.key}>
                                <th scope="row">{row.label}</th>
                                <td>{show(row, a)}</td>
                                <td>{show(row, b)}</td>
                                <td className={diff === 0 || row.neutral ? '' : better ? 'is-better' : 'is-worse'}>
                                    {diff === 0 ? '–' : `${diff > 0 ? '+' : '−'}${show(row, Math.abs(diff))}`}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            {!both && <p className="form__hint">Only menus that were in use have income to compare.</p>}

            <div className="d-flex flex-column gap-0-5">
                <h3 className="version-compare__heading">Dishes: {older.name} → {newer.name}</h3>
                {error && <p className="form__error" role="alert">{error}</p>}
                {!changes && !error && <p role="status">Loading…</p>}
                {changes && <VersionChanges changes={changes} empty="The same dishes and prices." />}
            </div>
        </div>
    )
}

export default VersionCompare
