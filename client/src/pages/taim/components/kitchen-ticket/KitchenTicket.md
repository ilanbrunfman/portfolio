# KitchenTicket

One ticket on the Kitchen screen: what one table sent in one round (or one
take-out), so the cooks see it the way it was ordered.

- **Header:** "T5" / "T1 + T4 + T7" / "Take-out · Maya", "Round 2 · sent
  20:25", and the minutes since it was sent.
- **Each dish:** its name, seat tag (Seat 2 / Shared, tables only) and the
  time against its prep time: "8 of 12 min". **Amber** at 80% of the prep
  time, **red** with a **Late** tag once past it. A dish with no prep time
  just shows the minutes.
- **The ticket's top edge** takes the colour of its worst dish, so a late
  ticket stands out in the grid.
- **Served** on each dish, and **Serve all 3** at the bottom when there's
  more than one (both only with `onServe`). Errors show in the ticket.

The colours come from `timing(elapsedMinutes, prepMinutes)` in `utils/orders.js` → `'ok' | 'soon' | 'late'`.

## Usage

```jsx
<KitchenTicket ticket={ticket} now={now} onServe={can('advanceDish') ? serve : undefined} />
```

## Props

| Prop      | Type                       | Description |
|-----------|----------------------------|-------------|
| `ticket`  | `object`                   | From `GET /api/taim/kitchen`: `{ title, type, round, firedAt, dishes }`. |
| `now`     | `number`                   | Current time in ms, so minutes keep counting. |
| `onServe` | `(dishId) => Promise`      | Optional. Mark a dish served; throws on failure. |
