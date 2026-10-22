# TransactionForm

Add, edit or delete a transaction. Built from the form kit (`RadioGroup`,
`Input`, `Combobox`, `Button`) and meant to be placed inside a `Modal`.

- **Type**: Expense or Income. The amount is always typed as a positive
  number; the type decides the sign that's sent (cents).
- **Amount**, **Date** (defaults to today), **Description**, optional
  **Category** and **Note**.
- **Description** suggests earlier descriptions (from `recent`). Picking one
  fills in the category it had last time, if no category is chosen yet.
- **Category** only lists categories of the chosen type and must match one.
- Browser checks first; server field errors (`err.fields`) show under the
  matching input (`categoryId` → Category).
- Edit mode adds **Delete**, with a confirm step inside the form (no browser
  dialog).
- **Transfer** sides can't be edited yet: the form explains that and offers
  **Delete transfer**, which removes both sides.

Saving goes through `BankContext` (`createTransaction`, `updateTransaction`,
`deleteTransaction`), which also refreshes the account balance.

## Usage

```jsx
<Modal isOpen={open} onClose={close} title={transaction ? 'Edit transaction' : 'New transaction'}>
    <TransactionForm account={account} transaction={transaction} recent={items} onDone={handleDone} />
</Modal>
```

## Props

| Prop          | Type                         | Description |
|---------------|------------------------------|-------------|
| `account`     | `object`                     | The account the transaction belongs to. |
| `transaction` | `object \| null`             | The transaction to edit, or `null` to add one. |
| `recent`      | `object[]`                   | Loaded transactions, newest first (for suggestions). |
| `onDone`      | `(changed: boolean) => void` | `true` after save/delete, `false` on Cancel/Close. |

Must be rendered inside `BankProvider`.
