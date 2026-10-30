# MonthBars

Twelve bars, January to December: money lost per month on the Losses
screen (or a count, with `format`, e.g. fixes). Taller = more lost; the amount sits on top (hidden on a phone).

- Each bar is a button: **tap a month** to pick it (red, `aria-pressed`),
  **tap it again** to go back to the whole year.
- Months that haven't happened yet are dimmed (`lastMonth`).

## Usage

```jsx
<MonthBars values={perMonth} selected={month} onSelect={setMonth} lastMonth={isThisYear ? today.getMonth() : 11} />
```

## Props

| Prop        | Type                         | Description |
|-------------|------------------------------|-------------|
| `values`    | `number[]`                   | Twelve amounts in cents, Jan → Dec. |
| `selected`  | `number \| null`             | Picked month 0–11, or `null` for the whole year. |
| `onSelect`  | `(month \| null) => void`    | Called on tap. |
| `lastMonth` | `number`                     | Last month that has happened; later ones are dimmed. Default 11. |
| `format`    | `(value) => string`          | How a value shows (default money, "$46"); e.g. a count. |
