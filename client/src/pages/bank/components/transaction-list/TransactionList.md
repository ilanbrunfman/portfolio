# TransactionList

An account's transactions grouped by day (newest first). Each row shows the
description, a category pill (or **Transfer**), an optional note, the amount
(green with `+` for money in) and the running balance after it.

## Usage

```jsx
<TransactionList items={items} onSelect={(t) => openEditor(t)} />
```

## Props

| Prop       | Type                     | Description |
|------------|--------------------------|-------------|
| `items`    | `object[]`               | Transactions from `GET /api/accounts/:id/transactions`, already newest first. |
| `onSelect` | `(transaction) => void`  | Optional. Rows become buttons that call it (e.g. open the edit form). |

The category pill color comes from the CSS variable `--tag` (the category's color).
