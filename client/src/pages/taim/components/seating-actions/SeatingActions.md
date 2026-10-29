# SeatingActions

Lets a host (or waiter, or manager) fix a seating mistake:

- **Move or change guests** (table orders): a form, opened in place, with the tables you can
  move to (this one, plus every table that's free and clean) and the guest
  count. Sends `PATCH /api/taim/orders/:id`. The server still decides: a
  table seated a moment ago, one that needs cleaning, or fewer guests than
  a seat that already has dishes all come back as an error shown in the
  form. It opens in place rather than in a dialog, because on the Floor
  this already sits inside the bill dialog.
- **Undo seating** / **Cancel take-out**: only while nothing has been
  ordered. It asks once more ("Yes, undo seating" / "Keep"), then sends
  `DELETE /api/taim/orders/:id`. After that the order is gone and the
  table is green again.

## Usage

```jsx
{can('seatTable') && (
    <SeatingActions order={order} onUpdate={update} onUndo={async () => { await undo(); navigate('/taim/floor') }} />
)}
```

## Props

| Prop       | Type                              | Description |
|------------|-----------------------------------|-------------|
| `order`    | `object`                          | The open order. |
| `onUpdate` | `({ tableId?, guests? }) => Promise` | Move and/or change guests; throws on failure. |
| `onUndo`   | `() => Promise`                   | Undo the seating; throws on failure. |
