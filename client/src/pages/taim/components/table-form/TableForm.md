# TableForm

Adds a table to the Ta'im floor (Manager only; the server refuses anyone
else). Fields: **Label** (prefilled with the next free "T" number) and
**Seats**. New tables go to the end of the floor. A label that's already
used gets "There is already a table with this label" under the input.

## Usage

```jsx
<Modal isOpen={open} onClose={close} title="Add table" size="sm">
    <TableForm suggestedLabel="T9" onSave={createTable} onDone={close} />
</Modal>
```

## Props

| Prop             | Type                           | Description |
|------------------|--------------------------------|-------------|
| `suggestedLabel` | `string`                       | Prefilled label. |
| `onSave`         | `({ label, seats }) => Promise` | Throws with `err.fields` on failure. |
| `onDone`         | `() => void`                   | Called after saving, and on Cancel. |
