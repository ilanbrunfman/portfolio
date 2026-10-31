# DishDetails

The popup a waiter sees when tapping a dish on the Order screen, so they can
tell the guest about it before adding it:

- the **price** and **description** (or a note that there's none yet),
- **For:** which seats it's for. Seats are **checkboxes** (pick several:
  one dish each), **Shared** is a **radio** for the whole table: picking it
  clears the seats, and ticking a seat clears Shared. Prefilled with the
  seat picked above the menu; not shown for a take-out,
- **To go** (tables only): the guests take it home. It's packed, not
  plated, and stays on the same bill; the button ends with "· to go",
- **How many** (− 1 +, up to 10), per seat ("How many each" with several),
- **Add**, which says exactly what will happen: "Add 2 · $18.00 for Seats 1
  and 3", "Add $9.00 for the table". Nothing ticked: disabled.

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
            onAdd={({ seats, quantity, toGo }) => addDish(dish.id, seats.map(seatFromValue), quantity, toGo)}
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
| `allergies` | `{ seat, allergens }[]`          | Optional. The bill's allergies (step 5.4): a clash at a picked seat shows a red warning, and Add needs "The kitchen will adapt it / the guest knows" (sent as `allergyConfirmed`). |
| `seat`   | `string`                              | Pre-picked seat value (`'1'` … `'shared'`). |
| `onAdd`  | `({ seats, quantity, toGo }) => Promise` | `seats`: `['1', '3']`, `['shared']`, or `[]` on a take-out; `toGo`: to take home. Adds to the bill; throws on failure. |
| `onDone` | `() => void`                          | Called after adding, and on Close. |

## Allergies (step 5.4)

The popup lists what the dish contains ("Contains gluten, sesame"). When that clashes with an allergy at a picked seat (or anyone's, for Shared; the guest's, on a take-out), a red box names who and what, and Add stays disabled until the waiter ticks the confirmation.
