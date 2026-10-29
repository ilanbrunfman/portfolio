# Ticket

The bill of one Ta'im order: a title ("T2 · 3 guests" or "Take-out · Maya"),
when and by whom it was opened, each dish with where it is and its price,
and the total.

Where a dish is:

- **Not sent** (accent, dashed line): on the bill, the kitchen doesn't have
  it yet. The waiter can still change or remove it freely.
- **In kitchen · 14 min**: sent to the kitchen that long ago, not out yet.
- **Served**: the kitchen sent it out.
- **Came back**: crossed out, not on the bill (it counts as money lost).

At a table the dishes are grouped by seat (**Seat 1**, **Seat 2**, …, then
**Shared**), so whoever brings the food knows who gets what. A take-out is
one list.

Buttons, when the matching prop is given:

- `onSend`: **Send to kitchen (3)**, the main button while dishes are
  waiting to be sent.
- `onClose`: **Close bill**, which asks once more ("Close bill · $40.00" /
  "Not yet"). While dishes haven't been sent it's replaced by a hint: send
  or remove them first (the server refuses too).
- `onEditItem`: every dish line is one button (the Order screen opens the
  dish editor: change seat, remove).

Errors from these actions show at the top of the ticket. The title comes
from `orderTitle(order)` in `utils/orders.js`.

## Usage

```jsx
<Ticket
    order={order}
    onEditItem={can('addDishes') ? openEditor : undefined}
    onSend={can('addDishes') ? send : undefined}
    onClose={can('closeBill') ? close : undefined}
/>
```

## Props

| Prop        | Type                         | Description |
|-------------|------------------------------|-------------|
| `order`     | `object`                     | An order from the API (`items`, `total`, `openedBy`, …). |
| `onEditItem` | `(item) => void`            | Optional. Makes each dish line tappable. |
| `onSend`    | `() => Promise`              | Optional. Send the dishes not sent yet to the kitchen. |
| `onClose`   | `() => Promise`              | Optional. Close the bill. |
| `className` | `string`                     | Extra classes on the section. |
