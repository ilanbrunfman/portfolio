# LiveTimer

A running timer, `HH:MM:SS` since a moment, ticking every second. Each digit
is a column of 0–9 behind a one-line window that slides to the right digit,
so digits roll up as time passes, like an odometer. With the system's
"reduce motion" setting the digits just change.

Used on the **Clock** tab (step 8.2): how long you've been on the clock
(large), and how long the break has run (small).

Screen readers get `role="timer"` and a label like "On the clock: 2 hours
14 minutes" (not every second read aloud).

## Usage

```jsx
<LiveTimer since={entry.clockIn} label="On the clock" />
<LiveTimer since={runningBreak.startAt} size="sm" label="On a break" />
```

## Props

| Prop    | Type              | Description |
|---------|-------------------|-------------|
| `since` | `string \| Date`  | When it started. |
| `size`  | `'lg' \| 'sm'`    | Default `lg`. |
| `label` | `string`          | What it counts, for screen readers. Default `Time`. |
