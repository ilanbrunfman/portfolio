# CameBackForm

What the waiter fills in when a guest gives a served dish back (inside the
bill item editor, after tapping **Came back**):

- **Why did it come back?** one of: Cold, Wrong dish, Taste, Undercooked,
  Allergy / something in it, Too slow, Other (required).
- **Note** (optional, up to 200 characters): "lukewarm in the middle".
- **What now?**
  - **Fix it (same plate):** undercooked steak, not enough spices – the same
    plate goes back to the kitchen (marked FIX, first in line) and stays on
    the bill. No loss, but the fix is recorded.
  - **Make it again (free):** the same dish, same seat, on the house.
  - **Another dish instead (free):** pick it from a small menu (sold-out
    dishes greyed): the right dish when the wrong one was served, something
    else, or a dessert on us.
  - **Nothing more:** just take it off. Anything the guest orders after that
    is added from the menu and charged as usual.
- **Send to the kitchen now** (for a free dish, on by default): untick it
  for a dessert that should come later – it waits on the bill as not sent,
  free, and goes with the next send.
- A line says what will happen and the loss: "Shakshuka comes off the
  bill; Malabi on the house waits on the bill for the next send. Loss:
  $21.00."
- The button stays off until a reason, "what now" (and the dish) are picked.

## Usage

```jsx
<CameBackForm item={item} menu={menu.categories} onSubmit={(data) => cameBack(item.id, data)} onCancel={back} />
```

## Props

| Prop       | Type                                     | Description |
|------------|------------------------------------------|-------------|
| `item`     | `object`                                 | The served dish: `{ name, price }`. |
| `menu`     | `object[]`                               | Menu categories with dishes, for "another dish". |
| `onSubmit` | `({ reason, note, fix, remake, replaceWithId, sendNow }) => Promise` | Records it; throws on failure. |
| `onCancel` | `() => void`                             | Back to the editor. |
