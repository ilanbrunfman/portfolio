# OrderCard

One open order on the Order screen, drawn like the Floor's table cards so a
waiter reads both the same way. The whole card links to the order.

- **Top line:** the table ("T5", or "T1 + T4" for combined tables)
  or the take-out's name, and the bill so far.
- **Guests · minutes** since it opened (take-outs say "Take-out"), and who
  opened it when it isn't you.
- **Dishes:** the ones the guests get – dishes that came back or were wasted
  aren't counted. "No dishes yet" with a dashed border while it's empty.
- **How the food is coming along** (the Floor's `KitchenProgress`): not
  sent, on hold, fired by the kitchen, to go, in the kitchen with minutes
  and the seats still waiting.
- **Blue "All served"** (tables) or **"Ready for pickup"** (take-outs) when
  nothing is left to come; grey while food is coming.
- **"1 came back"**: a red tag.

## Usage

```jsx
<OrderCard order={order} now={now} mine={order.openedBy.id === session.staff.id} />
```

## Props

| Prop    | Type      | Description |
|---------|-----------|-------------|
| `order` | `object`  | An open order from `GET /api/taim/orders` (with its items). |
| `now`   | `number`  | Current time in ms. |
| `mine`  | `boolean` | Opened by the person using the app: hides "· Lior". |
