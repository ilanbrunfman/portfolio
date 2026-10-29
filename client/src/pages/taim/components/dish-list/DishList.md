# DishList

One menu category's dishes as rows you can **drag to reorder**. Built on
[dnd-kit](https://dndkit.com) (`@dnd-kit/core` + `@dnd-kit/sortable`), which
handles mouse, touch and keyboard.

Each row: a grip handle, the name (with a "Sold out" tag) and description,
the price, an "On menu" checkbox and Edit.

## Dragging

- **Mouse / touch:** drag the grip (six dots). Only the grip starts a drag,
  so the rest of the row scrolls normally on a phone. A 5px move is needed
  before a drag starts, so a tap is still a tap. Rows move up and down only.
- **Keyboard:** Tab to a grip, Space or Enter to pick it up, arrow keys to
  move, Space or Enter to drop, Escape to cancel.
- **Screen readers** hear the dish's name and place ("Picked up Sabich,
  position 2 of 5"), not internal ids.

On drop, `onReorder` gets every dish id in the new order (top first). The
Menu screen sends it to `PUT /api/taim/categories/:id/dish-order`, shows the
new order straight away, and puts the old one back if the server refuses.

## Usage

```jsx
<DishList
    dishes={category.items}
    onReorder={(dishIds) => reorderDishes(category.id, dishIds)}
    onToggle={(dish) => toggleOnMenu(dish)}
    onEdit={(dish) => openEditForm(dish)}
    toggling={togglingId}
/>
```

## Props

| Prop        | Type                      | Description |
|-------------|---------------------------|-------------|
| `dishes`    | `object[]`                | The category's dishes, top first. |
| `onReorder` | `(dishIds: number[]) => void` | Called after a drop that changed the order. |
| `onToggle`  | `(dish) => void`          | Switch the dish on/off the menu. |
| `onEdit`    | `(dish) => void`          | Open the dish's edit form. |
| `toggling`  | `number \| null`          | Id of the dish being switched; its checkbox is disabled. |
