# Ticket

The bill of one Ta'im order: a title ("T2 · 3 guests" or "Take-out · Maya"),
when and by whom it was opened, each dish with where it is and its price,
and the total.

Where a dish is:

- **Not sent** (accent, dashed line): on the bill, the kitchen doesn't have
  it yet. The waiter can still change or remove it freely.
- **On hold** (violet, dashed line): not sent on purpose, e.g. the mains
  while the starters are eaten. Waits for **Fire held**.
- **In kitchen · 14 min**: sent to the kitchen that long ago, not out yet.
- **Served**: the kitchen sent it out.
- **Came back**: crossed out, not on the bill (it counts as money lost).

The dishes are grouped the way they were ordered: **Round 1 · sent 20:05**
(e.g. the starters), **Round 2 · sent 20:25** (the mains added later), …
then **On hold**, and **Not sent yet** last. At a table every dish carries a seat tag
(**Seat 2**, **Shared**), and inside a round dishes go seat by seat, so
whoever brings the food knows who gets what. Rounds come from
`groupByRound(order)` in `utils/orders.js`.

Buttons, when the matching prop is given:

- `onSend`: **Send to kitchen (3)**, the main button while dishes are
  waiting to be sent (the Order screen may open the SendDialog to hold some).
- `onFire`: **Fire held (2)** sends the dishes on hold (and any added since).
- `onClose`: **Close bill**, then a green **Pay · $40.00** to take the
  payment and close the bill (or "Not yet"). While dishes haven't been sent or are on hold it's replaced by a hint: fire, send
  or remove them first (the server refuses too).
- `onEditItem`: every dish line is one button (the Order screen opens the
  dish editor: change seat, remove).

Errors from these actions show at the top of the ticket. The title comes
from `orderTitle(order)` in `utils/orders.js`.

## Usage

```jsx
<Ticket
    order={order}
    onEditItem={canEditDishes(order.type) ? openEditor : undefined}
    onSend={canEditDishes(order.type) ? send : undefined}
    onClose={can('closeBill') ? close : undefined}
/>
```

## Props

| Prop        | Type                         | Description |
|-------------|------------------------------|-------------|
| `order`     | `object`                     | An order from the API (`items`, `total`, `openedBy`, …). |
| `onEditItem` | `(item) => void`            | Optional. Makes each dish line tappable. |
| `onSend`    | `() => Promise \| void`      | Optional. Send the dishes not sent yet (or open the dialog to hold some). |
| `onFire`    | `() => Promise`              | Optional. Send the dishes on hold. |
| `onClose`   | `() => Promise`              | Optional. Close the bill. |
| `className` | `string`                     | Extra classes on the section. |
