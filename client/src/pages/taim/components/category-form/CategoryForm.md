# CategoryForm

Add or rename a section of the Ta'im menu (Starters, Mains, …). Meant to sit
inside a `Modal`. New categories go to the end of the menu.

When editing a category that has no dishes, a **Delete category** button
appears. A category with dishes can't be deleted (the server refuses with
409 too): dishes are never deleted, only hidden, because orders point to
them.

## Usage

```jsx
<Modal isOpen={open} onClose={close} title="Rename category">
    <CategoryForm
        category={mains}
        onSave={(name) => renameCategory(mains.id, name)}
        onDelete={() => deleteCategory(mains.id)}
        onDone={close}
    />
</Modal>
```

## Props

| Prop       | Type                      | Description |
|------------|---------------------------|-------------|
| `category` | `object \| null`          | `{ id, name, items }` to edit, or `null` to add one. |
| `onSave`   | `(name) => Promise`       | Create or rename; throws with `err.fields` on failure. |
| `onDelete` | `() => Promise`           | Optional. Offered only when `category.items` is empty. |
| `onDone`   | `() => void`              | Called after saving or deleting, and on Cancel. |
