# LiveTimer

A running timer, `HH:MM:SS` since a moment, ticking every second. Each digit
is a column of 0–9 behind a one-line window that slides to the right digit,
so digits roll up as time passes, like an odometer. With the system's
"reduce motion" setting the digits just change.

Two kinds:

- **`clock`** (default): `HH:MM:SS`, ticking every second. The **Clock**
  tab (step 8.2): how long you've been on the clock (large), and how long
  the break has run (small).
- **`minutes`**: `28 min`, the minutes rolling once a minute. A **kitchen
  ticket**'s time since it was sent (5.5): calm, read at a glance.

Screen readers get `role="timer"` and a label like "On the clock: 2 hours
14 minutes" (not every second read aloud).

## Usage

```jsx
<LiveTimer since={entry.clockIn} label="On the clock" />
<LiveTimer since={runningBreak.startAt} size="sm" label="On a break" />
<LiveTimer since={ticket.firedAt} kind="minutes" size="inherit" label="Waiting since sent" />
```

## Props

| Prop    | Type              | Description |
|---------|-------------------|-------------|
| `since` | `string \| Date`  | When it started. |
| `size`  | `'lg' \| 'sm' \| 'inherit'` | Default `lg`; `inherit` takes the surrounding text's size and colour. |
| `kind`  | `'clock' \| 'minutes'` | Default `clock`. |
| `className` | `string`      | Extra classes. |
| `label` | `string`          | What it counts, for screen readers. Default `Time`. |
