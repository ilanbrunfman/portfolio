# SendDialog

"Send to kitchen" when the waiter has a choice: a table ordered starters
and mains at once, and wants the mains later.

- The dishes not sent yet, grouped by **menu category**, each with a
  checkbox (ticked = goes now) and its seat tag at a table.
- **Hold Mains** / **Send Mains** in each category's header (only when there
  is more than one category) flips the whole course.
- Unticked dishes show **On hold**. Dishes already on hold start unticked;
  newly added ones start ticked.
- The button says what happens: **Send 2, hold 2**. Nothing ticked = disabled.
- Errors (e.g. a dish another waiter just sent) show in the dialog.

The Order screen opens it only when the dishes waiting span more than one
category; otherwise "Send to kitchen" sends straight away. Held dishes go
later with **Fire held** on the bill.

## Usage

```jsx
<SendDialog items={waiting} atTable={order.type === 'TABLE'} onSend={send} onDone={close} />
```

## Props

| Prop      | Type                          | Description |
|-----------|-------------------------------|-------------|
| `items`   | `object[]`                    | The order's dishes not sent yet (`status: 'NEW'`), with `category` and `held`. |
| `atTable` | `boolean`                     | Show seat tags. |
| `onSend`  | `(itemIds: number[]) => Promise` | Send these; the others go on hold. Throws on failure. |
| `onDone`  | `() => void`                  | Close the dialog. |
