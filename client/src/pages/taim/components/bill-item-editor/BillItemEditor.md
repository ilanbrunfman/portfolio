# BillItemEditor

Opens when the waiter taps a dish on the bill (Order screen). Two fixes:

- **For:** move the dish to another seat, or to Shared. Allowed any time
  while the bill is open, whatever the kitchen status: it only changes who
  gets the dish. **Save seat** is enabled once the seat changed.
- **Remove from bill:** before it's sent to the kitchen, or while the
  kitchen is still preparing it; asks
  once more ("Yes, remove Hummus"). Once a dish has been sent out, the
  editor says it stays on the bill: taking a cooked dish off is a loss, and
  will be recorded as "came back" with a reason (step 6), not deleted.

A take-out has no seats, so only Remove (when allowed) and Close show.

## Usage

```jsx
<Modal isOpen={Boolean(item)} onClose={close} title={item?.name} size="sm">
    {item && (
        <BillItemEditor
            item={item}
            seats={seatOptions(order)}
            onMove={(value) => moveDish(item.id, seatFromValue(value))}
            onRemove={() => removeDish(item.id)}
            onDone={close}
        />
    )}
</Modal>
```

## Props

| Prop       | Type                     | Description |
|------------|--------------------------|-------------|
| `item`     | `object`                 | A dish on the order: `{ name, price, seat, status }`. |
| `seats`    | `{ value, label }[]`     | Seat choices; `[]` for a take-out. |
| `onMove`   | `(seatValue) => Promise` | Saves the new seat; throws on failure. |
| `onRemove` | `() => Promise`          | Removes the dish; throws on failure. |
| `onDone`   | `() => void`             | Called after saving or removing, and on Close. |
