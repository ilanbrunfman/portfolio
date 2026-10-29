# TableCard

One table on the Ta'im Floor, drawn as a button, in one of three colours:

- **Green, ready:** label, seats, "Ready". Can be seated.
- **Yellow, needs cleaning:** the guests left (the bill was closed) and
  nobody has marked it clean yet. It can't be seated until then.
- **Grey, dining:** guests and minutes since they were seated, number of
  dishes and the bill so far.

A dining table also shows how its food is coming along, so the waiter can
ask the kitchen about "table 5, seat 3":

- **2 not sent** (accent): dishes on the bill the kitchen doesn't have yet.
- **In kitchen: 3 · 14 min** (amber): dishes being prepared, and how long
  the oldest has waited; **Waiting: seat 1, seat 3, shared** under it.
- **All served** (green): nothing left to come.

When a dish came back, a small red "1 came back" tag appears too.

**Combined tables** arrive as their main table with `groupLabel`
("T1 + T4 + T7") and `groupSeats`: the card shows those and a "Combined"
tag. While the Floor is choosing tables to combine, `selected` marks the
picked ones (accent border, `aria-pressed`).

`KitchenProgress` (the progress lines) is also exported, for the Floor's
take-out list.

The minutes keep counting because the Floor passes the current time
(`useNow`). The screen reader label sums it up: "T2, dining: 3 guests,
$40.00", "T3, needs cleaning", "T1, ready, 2 seats".

## Usage

```jsx
<TableCard table={table} now={now} onClick={() => open(table)} disabled={!table.order && !can('seatTable')} />
```

## Props

| Prop       | Type         | Description |
|------------|--------------|-------------|
| `table`    | `object`     | A table from `GET /api/taim/tables`; `order` is its open order's summary or `null`. |
| `now`      | `number`     | Current time in ms. |
| `onClick`  | `() => void` | What a tap does (seat, mark clean, open the order, show the bill). |
| `disabled` | `boolean`    | e.g. a free table for someone who can't seat guests. |
| `selected` | `boolean`    | While combining: picked or not (leave out otherwise). |
