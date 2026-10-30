# CameBackForm

What the waiter fills in when a guest gives a served dish back (inside the
bill item editor, after tapping **Came back**):

- **Why did it come back?** one of: Cold, Wrong dish, Taste, Undercooked,
  Allergy / something in it, Too slow, Other (required).
- **Note** (optional, up to 200 characters): "lukewarm in the middle".
- **What now?**
  - **Make it again (free):** a new one, same seat, goes to the kitchen
    straight away, marked REMAKE; it's on the house.
  - **Nothing more:** just take it off. If the guest wants something else,
    the waiter adds it from the menu as usual (charged normally).
- A line says what will happen and the loss: "Shakshuka comes off the
  bill, and a new one goes to the kitchen now, on the house. Loss: $28.00."
- The button stays off until a reason and "what now" are picked.

## Usage

```jsx
<CameBackForm item={item} onSubmit={(data) => cameBack(item.id, data)} onCancel={back} />
```

## Props

| Prop       | Type                                     | Description |
|------------|------------------------------------------|-------------|
| `item`     | `object`                                 | The served dish: `{ name, price }`. |
| `onSubmit` | `({ reason, note, remake }) => Promise`  | Records it; throws on failure. |
| `onCancel` | `() => void`                             | Back to the editor. |
