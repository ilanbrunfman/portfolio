# DishForm

Add or edit one dish of the Ta'im menu. Meant to sit inside a `Modal`.

Fields: **Name**, **Category** (radio buttons), **Price** (typed as dollars,
sent as cents), **Prep time** (optional, whole minutes 1–180: how long the
kitchen should take, so the Kitchen screen can show late dishes),
**Description** (optional) and **On the menu** (untick = sold out, sent as
`hidden: true`).

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
| `onSave`     | `(data) => Promise`        | Saves `{ categoryId, name, price, prepMinutes, description, hidden }`; throws with `err.fields` on failure. |
| `onDelete`   | `() => Promise`            | Optional. Shows **Remove dish** (asks once: "Yes, remove …"). Given only in the draft menu: dishes of the menu in use stay (bills point at them). |
| `onDone`     | `() => void`               | Called after a successful save or removal, and on Cancel. |

## Allergens (step 5.4)

**Contains (allergens)**: gluten, dairy, egg, peanuts, tree nuts, sesame, fish, shellfish, soy (sent as `allergens`). The waiter is warned when a dish clashes with a guest's allergy. Unlike prices, allergens can be fixed on the menu in use too.
