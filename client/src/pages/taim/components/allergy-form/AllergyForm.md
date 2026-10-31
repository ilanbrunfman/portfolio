# AllergyForm

Note a guest's allergy on a bill (step 5.4), from the Order screen's
**Allergies** button. Meant to sit inside a `Modal`.

- **Who** (tables): *Whole table* or a seat (1…guests). A take-out has one
  allergy for the whole order, so there's no choice.
- **Allergic to:** gluten, dairy, egg, peanuts, tree nuts, sesame, fish,
  shellfish, soy.
- **Note:** how serious, or anything else ("severe", "no pork"); the
  kitchen sees it on the ticket.

Picking a seat shows what's noted for it already. **Remove** clears it;
saving needs at least an allergen or a note. Notes stay with this bill
only, never with a person.

## Usage

```jsx
<Modal isOpen={open} onClose={close} title="Allergies" size="sm">
    <AllergyForm order={order} seat={2} onSave={(body) => noteAllergy(body)} onDone={close} />
</Modal>
```

## Props

| Prop     | Type                                   | Description |
|----------|----------------------------------------|-------------|
| `order`  | `object`                               | `{ type, guests, allergies }` from the API. |
| `seat`   | `number \| null`                       | Seat to start on; `null` = whole table (default). |
| `onSave` | `({ seat, allergens, note }) => Promise` | `PUT /orders/:id/allergies`; throws on failure. |
| `onDone` | `() => void`                           | After saving, and on Cancel. |
