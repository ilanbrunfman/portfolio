# DayReport

One closed business day's end-of-day report, exactly as it was saved when
the Manager or Chef tapped "Close the day" (the numbers never change
afterwards, like a printed report).

- **Header:** the day it started ("Thu 29 Oct": a night closed at 04:00
  Friday is still Thursday), when it ran ("15:10 → Fri 30 Oct 04:00", from
  the previous close) and who closed it, or "closed
  automatically" when the server did at the set time (04:00).
- **Figures:** Sales, Bills, Average bill, Guests (two per row on a phone).
- **Line under them:** tables and take-outs, and dishes that came back with
  their value, when there were any.

Used on the Bills screen: after closing the day, and in the "Closed days"
list of the week, month and year.

## Usage

```jsx
<DayReport day={day} />
```

## Props

| Prop  | Type     | Description |
|-------|----------|-------------|
| `day` | `object` | A BusinessDay from the API: `openedAt`, `closedAt`, `closedBy` (null = automatic), `billCount`, `tableBills`, `takeoutBills`, `guests`, `sales`, `cameBack`, `cameBackValue`. |
