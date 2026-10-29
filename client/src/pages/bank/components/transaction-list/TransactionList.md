# TransactionList

An account's transactions grouped by day (newest first). Each row shows the
description, a category pill (or **To Savings** / **From Checking** for a
transfer), an optional note, the amount
(green with `+` for money in) and the running balance after it.

## Usage

```jsx
<TransactionList items={items} onSelect={(t) => openEditor(t)} accountNames={{ 1: 'Checking', 2: 'Savings' }} />
```

## Props

| Prop       | Type                     | Description |
|------------|--------------------------|-------------|
| `items`    | `object[]`               | Transactions from `GET /api/bank/accounts/:id/transactions`, already newest first. |
| `onSelect` | `(transaction) => void`  | Optional. Rows become buttons that call it (e.g. open the edit form). |
| `accountNames` | `Record<number, string>` | Optional. Account names by id; transfer rows then say "To X" / "From X" (uses `counterpartAccountId`), otherwise just "Transfer". |

The category pill color comes from the CSS variable `--tag` (the category's color).
