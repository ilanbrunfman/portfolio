# TableCard

One table on the Ta'im Floor, drawn as a button:

- **Free** (green outline): label, seats, "Free".
- **Taken**: guests and minutes since they were seated, number of dishes
  and the bill so far.
- **A dish came back** (red): the same, plus "1 came back", so the host or
  manager notices.

The minutes keep counting because the Floor passes the current time
(`useNow`). The screen reader label sums it up: "T2, taken: 3 guests,
$40.00".

## Usage

```jsx
<TableCard table={table} now={now} onClick={() => open(table)} disabled={!table.order && !can('seatTable')} />
```

## Props

| Prop       | Type         | Description |
|------------|--------------|-------------|
| `table`    | `object`     | A table from `GET /api/taim/tables`; `order` is its open order's summary or `null`. |
| `now`      | `number`     | Current time in ms. |
| `onClick`  | `() => void` | What a tap does (seat, open the order, show the bill). |
| `disabled` | `boolean`    | e.g. a free table for someone who can't seat guests. |
