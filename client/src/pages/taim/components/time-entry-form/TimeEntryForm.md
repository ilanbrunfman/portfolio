# TimeEntryForm

Fix a time entry, or add one you forgot (step 8.2, **Clock** tab). Meant
to sit inside a `Modal`.

- **Date, Start, End:** an end earlier than the start is the next morning
  (in 17:00, out 01:30). An entry still running may keep its end empty.
- **Still working (no end yet)** (adding only, #44): the person is clocked
  in from the start time (they show in *Who's on now*, their timer counts
  from then) until they clock out. Refused if they're already clocked in.
- **Breaks (unpaid):** from / to each; add or remove them.
- **Total worked** is counted as you type: clocked time minus breaks.
- **Why the change?** is optional, one pick from a dropdown (the shared `Select`):
  Forgot to clock in · Forgot to clock out · Wrong start or end time · Break
  not recorded · Stayed late / came in early · Other. **Other** shows an
  optional "What happened?" field (sent as "Other: …"). Saving with no
  reason is fine. Every change is logged with the editor's name, and the entry's **Changes** (who, when,
  why, before → after) show at the bottom.
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
| `onSave`      | `({ clockIn, clockOut, breaks, reason }) => Promise` | `reason` may be `null`. Throws with `err.fields`. |
| `loadHistory` | `(id) => Promise<object[]>`       | Optional. The entry's edits. |
| `onDone`      | `() => void`                      | After saving, and on Cancel. |
