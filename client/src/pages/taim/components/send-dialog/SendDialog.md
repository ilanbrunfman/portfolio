# SendDialog

"Send to kitchen" on the Order screen: what goes to the kitchen now, and
what waits on hold (the mains while the starters are eaten).

- The dishes not sent yet, grouped by **menu category**, each with a
  checkbox (ticked = goes now) and its seat tag at a table.
- **Hold Mains** / **Send Mains** in each category's header flips the whole
  course.
- Unticked dishes show **On hold**. Dishes already on hold start unticked;
  newly added ones start ticked.
- The button says what happens: **Send 2, hold 2**. With nothing ticked it
  becomes **Hold 2** (violet outline): nothing is sent, the dishes wait on
  hold (e.g. the starter went earlier and the mains added now should wait).
- Errors (e.g. a dish another waiter just sent) show in the dialog.

The Order screen opens it for every "Send to kitchen". Held dishes go later
with **Fire held** on the bill.

## Usage

```jsx
<SendDialog items={waiting} atTable={order.type === 'TABLE'} onSend={send} onHold={hold} onDone={close} />
```

## Props

| Prop      | Type                          | Description |
|-----------|-------------------------------|-------------|
| `items`   | `object[]`                    | The order's dishes not sent yet (`status: 'NEW'`), with `category` and `held`. |
| `atTable` | `boolean`                     | Show seat tags. |
| `onSend`  | `(itemIds: number[]) => Promise` | Send these; the others go on hold. Throws on failure. |
| `onHold`  | `() => Promise`               | Hold every dish not sent yet, send nothing. Throws on failure. |
| `onDone`  | `() => void`                  | Close the dialog. |
