# VersionForm

A menu version's **name**, **season** (Spring, Summer, Autumn, Winter or
none) and **note**. Used to start a draft (Menu → Draft, when there's none)
and, in a `Modal`, to change them later.

## Usage

```jsx
<VersionForm submitLabel="Start draft" onSave={(data) => versions.startDraft(data)} />

<Modal isOpen={open} onClose={close} title="Draft details" size="sm">
    <VersionForm version={draft} onSave={(data) => versions.updateVersion(draft.id, data)} onDone={close} />
</Modal>
```

## Props

| Prop          | Type                               | Description |
|---------------|------------------------------------|-------------|
| `version`     | `object \| null`                   | `{ name, season, note }` to change, or `null` for a new draft. |
| `onSave`      | `({ name, season, note }) => Promise` | Throws with `err.fields` on failure (shown under the inputs). |
| `onDone`      | `() => void`                       | Optional. After saving and on Cancel; without it there's no Cancel. |
| `submitLabel` | `string`                           | Default `Save`. |
