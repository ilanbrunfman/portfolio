# TimeEntryForm

Fix a time entry, or add one you forgot (step 8.2, **Clock** tab). Meant
to sit inside a `Modal`.

- **Date, Start, End:** an end earlier than the start is the next morning
  (in 17:00, out 01:30). An entry still running may keep its end empty.
- **Breaks (unpaid):** from / to each; add or remove them.
- **Total worked** is counted as you type: clocked time minus breaks.
- **Why the change?** is required: every change is logged with the
  editor's name, and the entry's **Changes** (who, when, why, before →
  after) show at the bottom.
- An entry closed because nobody clocked out says so, in amber.

Everyone fixes their own entries; the Manager and Host anyone's (the
server checks).

## Usage

```jsx
<Modal isOpen={Boolean(editing)} onClose={close} title="Time entry">
    <TimeEntryForm entry={editing} onSave={(body) => sheet.edit(editing.id, body)} loadHistory={sheet.history} onDone={close} />
</Modal>
```

## Props

| Prop          | Type                              | Description |
|---------------|-----------------------------------|-------------|
| `entry`       | `object \| null`                  | From the timesheet, or `null` to add one. |
| `onSave`      | `({ clockIn, clockOut, breaks, reason }) => Promise` | Throws with `err.fields`. |
| `loadHistory` | `(id) => Promise<object[]>`       | Optional. The entry's edits. |
| `onDone`      | `() => void`                      | After saving, and on Cancel. |
