# TableCard

One table on the Ta'im Floor, drawn as a button, in one of three colours:

- **Green, ready:** label, seats, "Ready". Can be seated.
- **Yellow, needs cleaning:** the guests left (the bill was closed) and
  nobody has marked it clean yet. It can't be seated until then.
- **Grey, dining:** guests and minutes since they were seated, number of
  dishes and the bill so far.

When a dish came back, a small red "1 came back" tag appears on a dining
table, so the host or manager notices.

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
