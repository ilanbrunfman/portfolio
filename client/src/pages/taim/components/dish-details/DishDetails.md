# DishDetails

The popup a waiter sees when tapping a dish on the Order screen, so they can
tell the guest about it before adding it:

- the **price** and **description** (or a note that there's none yet),
- **For:** which seat it's for (Seat 1…N, or Shared for the whole table),
  prefilled with the seat picked above the menu; not shown for a take-out,
- **How many** (− 1 +, up to 10),
- **Add**, which says exactly what will happen: "Add 2 · $28.00 for Seat 2".

A sold-out dish shows a "Sold out" tag and its description, but no add
button. Server errors (e.g. it was just marked sold out) show in the popup.

## Usage

```jsx
<Modal isOpen={Boolean(dish)} onClose={close} title={dish?.name} size="sm">
    {dish && (
        <DishDetails
            dish={dish}
            seats={seatOptions(order)}
            seat={pickedSeat}
            onAdd={({ seat, quantity }) => addDish(dish.id, seatFromValue(seat), quantity)}
            onDone={close}
        />
    )}
</Modal>
```

## Props

| Prop     | Type                                  | Description |
|----------|---------------------------------------|-------------|
| `dish`   | `object`                              | `{ name, price, description, hidden }`. |
| `seats`  | `{ value, label }[]`                  | Seat choices; `[]` for a take-out. |
| `seat`   | `string`                              | Pre-picked seat value (`'1'` … `'shared'`). |
| `onAdd`  | `({ seat, quantity }) => Promise`     | Adds to the bill; throws on failure. |
| `onDone` | `() => void`                          | Called after adding, and on Close. |
