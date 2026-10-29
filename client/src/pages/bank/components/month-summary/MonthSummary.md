# MonthSummary

One month at a glance, from `GET /api/bank/summary?month=YYYY-MM`:

- **Income**, **Spent** and **Net** for the month.
- **Last 6 months**: income (green) vs spending (red) bars. Click a month to
  select it. A visually hidden table (`.sr-only`) gives screen readers the
  same numbers.
- **Spending by category**, biggest first, with each category's share of
  the month's spending and a bar in its color.
- Previous / next month buttons (next is disabled on the current month).

Transfers between your own accounts and archived accounts don't count as
income or spending (the server leaves them out).

## Usage

```jsx
<MonthSummary />
```

No props. Must be rendered inside `BankProvider`; it re-fetches when the
accounts change (e.g. after adding a transaction or archiving an account).
