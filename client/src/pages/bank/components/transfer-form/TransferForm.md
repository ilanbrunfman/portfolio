# TransferForm

Move money between two of your accounts, or edit / delete an existing
transfer. Built from the form kit (`RadioGroup`, `Input`, `Button`) and meant
to be placed inside a `Modal`.

- **From** and **To**: active accounts with their current balance. The
  "From" account is disabled in "To" (and cleared from it if picked).
- **Amount** (always positive), **Date** (today), **Description**
  (`Transfer` by default), optional **Note**.
- Edit mode loads the transfer from `GET /api/transfers/:transferId` first,
  then shows it prefilled, with **Delete** (confirm step; removes both sides).
- Server field errors (`fromAccountId`, `toAccountId`, …) show under the
  matching control; a 409 (archived account) shows on top.

The server writes both sides in one database transaction, so a transfer is
always complete or not there at all.

## Usage

```jsx
<Modal isOpen={open} onClose={close} title="Transfer">
    <TransferForm defaultFromId={account.id} onDone={handleDone} />
</Modal>

<TransferForm transferId={row.transferId} onDone={handleDone} />
```

## Props

| Prop            | Type                         | Description |
|-----------------|------------------------------|-------------|
| `transferId`    | `string \| null`             | Edit this transfer, or `null`/omitted to create one. |
| `defaultFromId` | `number`                     | Pre-selected "From" account when creating. |
| `onDone`        | `(changed: boolean) => void` | `true` after save/delete, `false` on Cancel. |

Must be rendered inside `BankProvider`.
