# SeatForm

Starts an order from the Floor, inside a `Modal`:

- **With a table:** "Guests" (prefilled with 2, or fewer for a smaller
  table; the hint shows the table's seats) and a **Seat T4** button.
- **Without one (`table={null}`):** "Name for the order" and **Start
  take-out**.

If someone else seated the table a moment earlier, the server answers
"This table is already seated" and the form shows it on top.

## Usage

```jsx
<SeatForm table={t4} onSave={(guests) => seatTable(t4.id, guests)} onDone={close} />
<SeatForm table={null} onSave={(name) => startTakeout(name)} onDone={close} />
```

## Props

| Prop     | Type                          | Description |
|----------|-------------------------------|-------------|
| `table`  | `object \| null`              | The free table to seat, or `null` for a take-out. |
| `onSave` | `(value) => Promise`          | Gets the guest count (number) or the name (text); throws on failure. |
| `onDone` | `() => void`                  | Called after saving, and on Cancel. |
