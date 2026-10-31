# PublishForm

The Manager or the Chef publishes the draft: **Now** (it becomes the menu in use at once)
or **From a date** (it's *scheduled* and switches by itself at that time;
the menu in use stays until then). Lists what will change first
(`VersionChanges`). Meant to sit inside a `Modal`.

## Usage

```jsx
<Modal isOpen={open} onClose={close} title={`Publish ${draft.name}`}>
    <PublishForm draft={draft} onPublish={(startsAt) => versions.publish(draft.id, startsAt)} onDone={close} />
</Modal>
```

## Props

| Prop        | Type                               | Description |
|-------------|------------------------------------|-------------|
| `draft`     | `object`                           | The draft: `{ name, changes }`. |
| `onPublish` | `(startsAt: Date \| null) => Promise` | `null` = now. Throws on failure. |
| `onDone`    | `() => void`                       | After publishing, and on Cancel. |

The date defaults to tomorrow at 11:00 (before opening); a time in the past
is refused in the form (the server would publish it now).
