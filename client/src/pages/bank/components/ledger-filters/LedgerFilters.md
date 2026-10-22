# LedgerFilters

Filter controls for an account's transactions: **Show** (All / Income /
Expenses / Transfers), **Search** (description or note), **Category**, and a
**From / To** date range, plus **Clear filters** when any is set.

Controlled: the parent owns `filters` (the account page keeps them in the URL
search params). `onChange` receives only what changed (e.g. `{ to: '2026-09-30' }`;
Clear sends every key as `''`), so the parent can merge it into the *latest*
filters and quick edits in a row never overwrite each other. The search box is
debounced (300 ms) so typing doesn't send a request per key.

## Usage

```jsx
<LedgerFilters filters={filters} onChange={setFilters} categories={categories} />
```

## Props

| Prop         | Type                         | Description |
|--------------|------------------------------|-------------|
| `filters`    | `{ q, type, categoryId, from, to }` | All strings; `''` means not set. |
| `onChange`   | `(changes) => void`          | Called with the changed keys only. |
| `categories` | `{ id, name }[]`             | For the Category box (typed text must match a name). |

`EMPTY_FILTERS` is exported from `filters.js` next to this component.
