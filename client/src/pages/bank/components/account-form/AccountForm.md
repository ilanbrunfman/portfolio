# AccountForm

Create or edit a bank account. Built from the form kit (`Input`,
`RadioGroup`, `Button`) and meant to be placed inside a `Modal`.

- **Name** (required), **Type** (Checking / Savings / Credit card / Cash),
  **Opening balance** (typed as dollars, sent as cents), **Color** (swatches).
- Checks the name and amount in the browser first; the server validates
  again and its messages (`err.fields`) show under the matching input.
- In edit mode it also has **Archive account** / **Restore account**.

## Usage

```jsx
<Modal isOpen={open} onClose={close} title={account ? 'Edit account' : 'New account'} size="sm">
    <AccountForm account={account} onDone={close} />
</Modal>
```

## Props

| Prop      | Type            | Description |
|-----------|-----------------|-------------|
| `account` | `object \| null` | The account to edit, or `null` to create a new one. |
| `onDone`  | `() => void`    | Called after saving, archiving/restoring, or on Cancel. |

Must be rendered inside `BankProvider` (uses `useBank()`).
