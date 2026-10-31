# VersionChanges

What changed between two menus, one line a dish:

- **+ Lentil soup** · $11.00, Starters (added)
- **~ Mint tea** · price $4.00 → $4.50 (changed: which fields, from → to)
- **− Watermelon salad** · $10.00, Starters (removed)

Dishes are matched by their key, so a renamed dish is "changed", not
removed and added. The server sends the list (added, then changed, then
removed).

## Usage

```jsx
<VersionChanges changes={draft.changes} empty="No dish changes yet." />
```

## Props

| Prop      | Type       | Description |
|-----------|------------|-------------|
| `changes` | `object[]` | `[{ type: 'added' \| 'removed' \| 'changed', name, price?, category?, fields? }]` |
| `empty`   | `string`   | What to say when nothing changed. Default `No dish changes.` |
