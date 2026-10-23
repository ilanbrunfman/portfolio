import { useEffect, useId, useState } from 'react'
import Input from '@/components/ui/form/input/Input'
import Combobox from '@/components/ui/form/combobox/Combobox'
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
import Button from '@/components/ui/button/Button'
import { EMPTY_FILTERS, hasFilters } from './filters'
import './LedgerFilters.scss'

const TYPES = [
    { value: '', label: 'All' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expenses' },
    { value: 'transfer', label: 'Transfers' },
]

/**
 * Search and filter controls for an account's transactions.
 * Controlled: `filters` in, `onChange(changes)` out – only the keys that
 * changed, e.g. { to: '2026-09-30' } (all values are strings, '' = not set).
 * Sending just the change lets the parent merge it into the latest filters,
 * so quick edits in a row never overwrite each other. The search box waits
 * 300ms after typing stops before calling onChange.
 *
 * @param {object} props
 * @param {{ q: string, type: string, categoryId: string, from: string, to: string }} props.filters
 * @param {(changes: object) => void} props.onChange
 * @param {{ id: number, name: string }[]} props.categories
 */
const LedgerFilters = ({ filters, onChange, categories }) => {
    const [search, setSearch] = useState(filters.q)
    const [categoryText, setCategoryText] = useState(
        categories.find((c) => String(c.id) === filters.categoryId)?.name ?? ''
    )

    // Debounced search: only send after 300ms without typing
    useEffect(() => {
        if (search === filters.q) return
        const timer = setTimeout(() => onChange({ q: search }), 300)
        return () => clearTimeout(timer)
    }, [search, filters.q, onChange])

    const handleCategory = (text) => {
        setCategoryText(text)
        const match = categories.find((c) => c.name.toLowerCase() === text.trim().toLowerCase())
        // Filter once the text names a category; clearing the box removes the filter
        if (match) onChange({ categoryId: String(match.id) })
        else if (!text.trim() && filters.categoryId) onChange({ categoryId: '' })
    }

    const isActive = hasFilters(filters)
    // Phones: everything except search folds behind a "Filters" button
    const [open, setOpen] = useState(false)
    const moreId = useId()
    const moreCount = ['type', 'categoryId', 'from', 'to'].filter((key) => filters[key]).length
    const clearAll = () => {
        setSearch('')
        setCategoryText('')
        onChange(EMPTY_FILTERS)
    }

    return (
        <section className="ledger-filters surface d-flex flex-column gap-1" aria-label="Filter transactions">
            <div className="d-flex align-items-end gap-0-5">
                <Input
                    label="Search"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Description or note"
                    autoComplete="off"
                    fieldClassName="ledger-filters__search"
                />
                {/* Phones only (hidden from md up, where everything is always shown).
                    The class sits on a wrapper: Button's own display rule would override it. */}
                <div className="d-md-none">
                    <Button
                        variant="secondary"
                        onClick={() => setOpen((value) => !value)}
                        aria-expanded={open}
                        aria-controls={moreId}
                    >
                        {moreCount ? `Filters (${moreCount})` : 'Filters'}
                    </Button>
                </div>
            </div>

            <div id={moreId} className={`${open ? 'd-flex' : 'd-none d-md-flex'} flex-column gap-1`}>
                <div className="d-flex flex-wrap justify-between align-items-center gap-1">
                    <RadioGroup
                        label="Show"
                        options={TYPES}
                        value={filters.type}
                        onChange={(type) => onChange({ type })}
                        direction="row"
                    />
                    {isActive && (
                        <Button variant="ghost" size="sm" icon="IconX" onClick={clearAll}>
                            Clear filters
                        </Button>
                    )}
                </div>
                <div className="d-grid grid-1 grid-sm-3 gap-1">
                    <Combobox
                        label="Category"
                        value={categoryText}
                        onChange={handleCategory}
                        options={categories.map((c) => c.name)}
                        placeholder="Any"
                        toggleLabel="Show categories"
                    />
                    <Input
                        label="From"
                        type="date"
                        value={filters.from}
                        max={filters.to || undefined}
                        onChange={(e) => onChange({ from: e.target.value })}
                    />
                    <Input
                        label="To"
                        type="date"
                        value={filters.to}
                        min={filters.from || undefined}
                        onChange={(e) => onChange({ to: e.target.value })}
                    />
                </div>
            </div>
        </section>
    )
}

export default LedgerFilters
