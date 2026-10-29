# DishForm

Add or edit one dish of the Ta'im menu. Meant to sit inside a `Modal`.

Fields: **Name**, **Category** (radio buttons), **Price** (typed as dollars,
sent as cents), **Description** (optional) and **On the menu** (untick =
sold out, sent as `hidden: true`).

The form checks the obvious things first (name, a price above 0); the server
validates again and its messages appear under the matching input, e.g.
"There is already a dish with this name".

## Usage

```jsx
<Modal isOpen={open} onClose={close} title="Add dish">
    <DishForm
        dish={null}
        categories={categories}
        categoryId={mains.id}
        onSave={(data) => createDish(data)}
        onDone={close}
    />
</Modal>
```

## Props

| Prop         | Type                       | Description |
|--------------|----------------------------|-------------|
| `dish`       | `object \| null`           | The dish to edit, or `null` to add one. |
| `categories` | `{ id, name }[]`           | Categories to pick from. |
| `categoryId` | `number`                   | Optional pre-picked category for a new dish. |
| `onSave`     | `(data) => Promise`        | Saves `{ categoryId, name, price, description, hidden }`; throws with `err.fields` on failure. |
| `onDone`     | `() => void`               | Called after a successful save, and on Cancel. |
