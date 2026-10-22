// Account types (same values as the server's AccountType enum) with labels.
export const ACCOUNT_TYPES = [
    { value: 'CHECKING', label: 'Checking' },
    { value: 'SAVINGS', label: 'Savings' },
    { value: 'CREDIT', label: 'Credit card' },
    { value: 'CASH', label: 'Cash' },
]

export const ACCOUNT_TYPE_LABEL = Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.value, t.label]))
