// Step 5.4: allergens and guests' allergies. The same rules as the server
// (services/allergies.js), so the screen can warn before asking it.

/** Every allergen, in the app's fixed order */
export const ALLERGENS = [
    { value: 'GLUTEN', label: 'Gluten' },
    { value: 'DAIRY', label: 'Dairy' },
    { value: 'EGG', label: 'Egg' },
    { value: 'PEANUTS', label: 'Peanuts' },
    { value: 'TREE_NUTS', label: 'Tree nuts' },
    { value: 'SESAME', label: 'Sesame' },
    { value: 'FISH', label: 'Fish' },
    { value: 'SHELLFISH', label: 'Shellfish' },
    { value: 'SOY', label: 'Soy' },
]

/** ['GLUTEN', 'TREE_NUTS'] → "gluten, tree nuts" */
export const allergenText = (list) => list.map((value) => ALLERGENS.find((a) => a.value === value)?.label.toLowerCase() ?? value).join(', ')

/**
 * What matters for a dish at this seat: its seat's allergies and the whole
 * table's; a shared dish (seat null) is everyone's.
 * @param {{ seat: number|null, allergens: string[] }[]} allergies  The bill's.
 */
export function allergensFor(allergies, seat) {
    const rows = seat === null ? allergies : allergies.filter((row) => row.seat === null || row.seat === seat)
    return [...new Set(rows.flatMap((row) => row.allergens))]
}

/** What in the dish someone at its seat is allergic to ([] = nothing) */
export const clashOf = (dishAllergens = [], allergies = [], seat = null) => {
    const guest = allergensFor(allergies, seat)
    return dishAllergens.filter((allergen) => guest.includes(allergen))
}

/** "Seat 2" · "Whole table" · "Take-out" */
export const allergyWho = (row, type = 'TABLE') => (row.seat !== null ? `Seat ${row.seat}` : type === 'TAKEOUT' ? 'Take-out' : 'Whole table')

/** "tree nuts (severe)" · "no pork" */
export function allergyWhat(row) {
    const what = allergenText(row.allergens)
    return [what, row.note && (what ? `(${row.note})` : row.note)].filter(Boolean).join(' ')
}
