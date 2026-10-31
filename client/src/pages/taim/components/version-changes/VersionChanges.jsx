import { formatMoney } from '@/pages/taim/utils/money'
import './VersionChanges.scss'

const FIELD_LABELS = { name: 'name', price: 'price', prepMinutes: 'prep time', description: 'description', category: 'category' }

/** One field's change in words: "price $13.00 → $14.00" */
function fieldChange(field, { from, to }) {
    if (field === 'price') return `price ${formatMoney(from)} → ${formatMoney(to)}`
    if (field === 'prepMinutes') return `prep ${from ?? '–'} → ${to ?? '–'} min`
    if (field === 'description') return to ? 'new description' : 'no description'
    return `${FIELD_LABELS[field]} ${from ?? '–'} → ${to ?? '–'}`
}

/**
 * What changed between two menus, one line a dish: + added (with price),
 * − removed, ~ changed (which fields, from → to).
 *
 * @param {object} props
 * @param {object[]} props.changes   [{ type: 'added'|'removed'|'changed', name, price?, category?, fields? }]
 * @param {string} [props.empty]     What to say when nothing changed.
 */
const VersionChanges = ({ changes, empty = 'No dish changes.' }) => {
    if (changes.length === 0) return <p className="form__hint">{empty}</p>
    return (
        <ul className="version-changes d-flex flex-column gap-0-5">
            {changes.map((change) => (
                <li key={`${change.type}-${change.name}`} className={`version-changes__row is-${change.type} d-flex align-items-baseline gap-0-5`}>
                    <span className="version-changes__mark" aria-hidden="true">{{ added: '+', removed: '−', changed: '~' }[change.type]}</span>
                    <span>
                        <span className="sr-only">{{ added: 'Added', removed: 'Removed', changed: 'Changed' }[change.type]}: </span>
                        <strong className="version-changes__name">{change.name}</strong>
                        <span className="version-changes__detail">
                            {change.type === 'changed'
                                ? ` · ${Object.entries(change.fields).map(([field, values]) => fieldChange(field, values)).join(', ')}`
                                : ` · ${formatMoney(change.price)}${change.category ? `, ${change.category}` : ''}`}
                        </span>
                    </span>
                </li>
            ))}
        </ul>
    )
}

export default VersionChanges
