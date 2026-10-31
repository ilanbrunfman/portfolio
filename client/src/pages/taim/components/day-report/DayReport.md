# DayReport

One closed business day's end-of-day report, exactly as it was saved when
the Manager or Chef tapped "Close the day" (the numbers never change
afterwards, like a printed report).

- **Header:** its date, from the server's `date` ("Thu 29 Oct": a night
  closed after midnight, up to 04:00 Friday, is still Thursday), and when
  and by whom it was closed ("Closed 23:51 by Noa", "Closed Fri 30 Oct
  04:00 automatically" when the server did at the set time).
- **Figures:** Sales, Bills, Average bill, Guests (two per row on a phone).
- **Line under them:** tables and take-outs, and dishes that came back with
  their value, when there were any.

Used on the Bills screen: after closing the day, and in the "Closed days"
tab of the week, month and year (grouped by day, week or month).

## Usage

```jsx
<DayReport day={day} />
```

## Props

| Prop  | Type     | Description |
|-------|----------|-------------|
| `day` | `object` | A BusinessDay from the API: `date` (the restaurant date it belongs to, named in the title), `openedAt`, `closedAt`, `closedBy` (null = automatic), `billCount`, `tableBills`, `takeoutBills`, `guests`, `sales`, `cameBack`, `cameBackValue`. |
