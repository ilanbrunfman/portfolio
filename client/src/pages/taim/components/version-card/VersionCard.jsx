import { useState } from 'react'
import Accordion from '@/components/ui/accordion/Accordion'
import Button from '@/components/ui/button/Button'
import VersionChanges from '@/pages/taim/components/version-changes/VersionChanges'
import { formatMoney } from '@/pages/taim/utils/money'
import { periodLabel, dayLabel } from '@/pages/taim/utils/versions'
import './VersionCard.scss'

/**
 * One menu version on the Versions tab: number, name, tags (Current,
 * Draft, Scheduled, Best income, Last), season and note, when it was in
 * use, who made and published it; for a menu that was in use its income
 * (total, per day, bills, average bill), how many dishes came back and
 * its top dishes; and, folded, what changed from the version before.
 *
 * @param {object} props
 * @param {object} props.version     From GET /menu/versions (with stats and changes).
 * @param {{ label: string, tone: string }[]} props.tags
 * @param {string} [props.basedOnName]  The version it was based on, for "Changes from …".
 * @param {() => void} [props.onCompare]  Open the compare view (with the menu in use).
 * @param {() => Promise} [props.onUseAgain]  Make this older menu the menu in use again (asks once first).
 */
const VersionCard = ({ version, tags, basedOnName, onCompare, onUseAgain }) => {
    const { stats, changes } = version
    const [confirming, setConfirming] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const useAgain = async () => {
        setBusy(true)
        setError('')
        try {
            await onUseAgain()
        } catch (err) {
            setError(err.message)
            setBusy(false)
            setConfirming(false)
        }
    }
    const people = [
        version.createdBy && `Made by ${version.createdBy.name}`,
        version.publishedBy && `published by ${version.publishedBy.name}, ${dayLabel(version.publishedAt)}`,
    ].filter(Boolean)

    return (
        <article className={`version-card surface d-flex flex-column gap-1 is-${version.status.toLowerCase()}`} aria-label={`Menu ${version.number}: ${version.name}`}>
            <header className="d-flex flex-wrap align-items-baseline justify-between gap-0-5">
                <span className="d-flex flex-wrap align-items-baseline gap-0-5">
                    <span className="version-card__number">#{version.number}</span>
                    <h3 className="version-card__name">{version.name}</h3>
                    {version.season && <span className="version-card__season">{version.season}</span>}
                </span>
                <span className="d-flex flex-wrap gap-0-5">
                    {tags.map((tag) => (
                        <span key={tag.label} className={`version-card__tag is-${tag.tone}`}>{tag.label}</span>
                    ))}
                </span>
            </header>

            <div className="d-flex flex-column">
                <span className="version-card__period">{periodLabel(version)}</span>
                {people.length > 0 && <span className="form__hint">{people.join(' · ')}</span>}
                {version.note && <span className="version-card__note">“{version.note}”</span>}
            </div>

            {stats && (
                <dl className="version-card__figures">
                    <div><dt>Income</dt><dd>{formatMoney(stats.income)}</dd></div>
                    <div><dt>Per day</dt><dd>{formatMoney(stats.perDay)}</dd></div>
                    <div><dt>Bills</dt><dd>{stats.bills}</dd></div>
                    <div><dt>Avg bill</dt><dd>{formatMoney(stats.averageBill)}</dd></div>
                </dl>
            )}
            {stats && (
                <p className="form__hint">
                    {version.dishCount} dishes · {stats.dishesSold} sold · {stats.returnRate}% came back
                    {stats.topDishes.length > 0 && ` · top: ${stats.topDishes.map((d) => `${d.name} (${d.count})`).join(', ')}`}
                </p>
            )}
            {!stats && <p className="form__hint">{version.dishCount} dishes · not in use yet, so no income</p>}

            {onUseAgain && (
                <div className="version-card__use d-flex flex-wrap align-items-center gap-0-5">
                    {confirming ? (
                        <>
                            <span className="form__hint mr-auto">It becomes the menu in use from now, as a new version. The current menu is archived.</span>
                            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>Keep current</Button>
                            <Button size="sm" onClick={useAgain} disabled={busy}>{busy ? 'Switching…' : `Yes, use ${version.name}`}</Button>
                        </>
                    ) : (
                        <Button size="sm" variant="secondary" onClick={() => setConfirming(true)}>Use this menu again</Button>
                    )}
                    {error && <p className="form__error" role="alert">{error}</p>}
                </div>
            )}

            {(changes || onCompare) && (
                <div className="d-flex flex-wrap align-items-start justify-between gap-0-5">
                    {changes && (
                        <Accordion className="version-card__changes">
                            <Accordion.Item title={`${changes.length} ${changes.length === 1 ? 'change' : 'changes'} from ${basedOnName ?? 'the menu before'}`}>
                                <VersionChanges changes={changes} />
                            </Accordion.Item>
                        </Accordion>
                    )}
                    {onCompare && <Button size="sm" variant="secondary" onClick={onCompare}>Compare with current</Button>}
                </div>
            )}
        </article>
    )
}

export default VersionCard
