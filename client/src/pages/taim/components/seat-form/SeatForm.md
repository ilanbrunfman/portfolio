# SeatForm

Starts an order from the Floor, inside a `Modal`:

- **With a table:** "Guests" (prefilled with 2, or fewer for a smaller
  table; the hint shows the table's seats) and a **Seat T4** button.
- **Without one (`table={null}`):** "Name for the order", **Phone** (to
  call when it's ready; the server checks it looks like a phone number) and
  **Start take-out**. `onSave` gets `{ customerName, customerPhone }`.

With `onNeedsCleaning`, a table also gets **Not clean? Needs cleaning** on
the left: if the table isn't clean enough after all, it goes back to yellow
on the Floor (`POST /api/taim/tables/:id/needs-cleaning`), so someone comes
back to it.

If someone else seated the table a moment earlier, the server answers
"This table is already seated" and the form shows it on top.

## Usage

```jsx
<SeatForm table={t4} onSave={(guests) => seatTable(t4.id, guests)} onDone={close} />
<SeatForm table={null} onSave={(data) => startTakeout(data)} onDone={close} />
```

## Props

| Prop     | Type                          | Description |
|----------|-------------------------------|-------------|
| `table`  | `object \| null`              | The free table to seat, or `null` for a take-out. |
| `onSave` | `(value) => Promise`          | Gets the guest count (number) or `{ customerName, customerPhone }`; throws on failure. |
| `onNeedsCleaning` | `() => Promise`      | Optional, table only: send it back to needing cleaning. |
| `onDone` | `() => void`                  | Called after saving, and on Cancel. |
