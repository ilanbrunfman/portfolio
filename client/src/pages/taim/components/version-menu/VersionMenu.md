# VersionMenu

One menu version's dishes, **read only** (Menu → Versions → **View
dishes**): each category with its dishes in order – name, description,
prep time, price, and a *Sold out* tag on the menu in use. Nothing here
changes the menu, so any version can be looked at safely. Meant to sit
inside a `Modal`. Loads `GET /api/taim/menu/versions/:id` (`useMenu(versionId)`).

## Usage

```jsx
<Modal isOpen={Boolean(viewing)} onClose={close} title={`#${viewing.number} ${viewing.name}`}>
    <VersionMenu versionId={viewing.id} />
</Modal>
```

## Props

| Prop        | Type     | Description |
|-------------|----------|-------------|
| `versionId` | `number` | The version to show. |
