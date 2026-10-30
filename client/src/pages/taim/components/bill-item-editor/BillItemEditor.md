# BillItemEditor

Once a dish was sent, it shows its timeline under the price: "Sent 20:05
(Lior) · started 20:07 (Yossi) · served 20:19 (Avi)".

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

## Came back (step 6)

- A **served** dish shows **Came back…** (with `onCameBack`): it opens the
  CameBackForm (why, note, make it again or not).
- A dish that **came back** shows why in red ("Came back: Cold · "lukewarm"
  · Lior, 20:30. Not on the bill."), no seat or to-go editing, and **Undo
  came back** (with `onUndoCameBack`) for a mistake.
- A **free remake** shows "Free remake (on the house)" instead of a price.

## Waste (step 6)

- **Remove** on a dish the kitchen already **started** says it counts as
  waste and records it (CANCELLED) instead of erasing it; a dish not
  started is still just removed.
- A **served** dish has **Dropped / spilled…** (with `onWaste`): a note, and
  "Make it again (the guest pays once)" ticked by default.
- A **wasted** dish shows why in amber ("Waste: Dropped / spilled · …").

## Usage

```jsx
<Modal isOpen={Boolean(item)} onClose={close} title={item?.name} size="sm">
    {item && (
        <BillItemEditor
            item={item}
            seats={seatOptions(order)}
            onSave={({ seat, toGo }) => updateDish(item.id, { seat: seatFromValue(seat), toGo })}
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
| `onSave`   | `({ seat, toGo }) => Promise` | Saves the seat value and to go; throws on failure. |
| `onCameBack` | `({ reason, note, remake }) => Promise` | Optional (markCameBack). Records the return. |
| `onUndoCameBack` | `() => Promise` | Optional (markCameBack). Undoes it. |
| `onWaste` | `({ reason, note, remake }) => Promise` | Optional (addDishes). Records waste. |
| `menu` | `object[]` | Menu categories, for "another dish instead". |
| `onRemove` | `() => Promise`          | Removes the dish; throws on failure. |
| `onDone`   | `() => void`             | Called after saving or removing, and on Close. |
