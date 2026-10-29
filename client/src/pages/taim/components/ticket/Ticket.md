# Ticket

The bill of one Ta'im order: a title ("T2 · 3 guests" or "Take-out · Maya"),
when and by whom it was opened, each dish with its kitchen status
(**Preparing**, **Sent out**, **Came back**) and price, and the total.

- A dish that **came back** is crossed out: it isn't on the bill (it counts
  as money lost instead). The total comes from the server, which leaves
  those dishes out.
- With `onRemove`, a **×** button appears on dishes that are still being
  prepared (the server refuses others).
- With `onClose`, a **Close bill** button appears; it asks once more
  ("Close bill · $40.00" / "Not yet") before closing.
- Errors from either action show at the top of the ticket.

The title comes from `orderTitle(order)` in `utils/orders.js`.

## Usage

```jsx
<Ticket
    order={order}
    onRemove={can('addDishes') ? removeDish : undefined}
    onClose={can('closeBill') ? close : undefined}
/>
```

## Props

| Prop        | Type                         | Description |
|-------------|------------------------------|-------------|
| `order`     | `object`                     | An order from the API (`items`, `total`, `openedBy`, …). |
| `onRemove`  | `(itemId) => Promise`        | Optional. Remove a dish that's still being prepared. |
| `onClose`   | `() => Promise`              | Optional. Close the bill. |
| `className` | `string`                     | Extra classes on the section. |
