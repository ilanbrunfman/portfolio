# AccountCard

Shows one bank account: colored strip, name, type, balance and how many
transactions it has. The whole card links to `/bank/accounts/:id` (the name
is a stretched link); the Edit button stays clickable on top. Negative balances (e.g. a credit card) are red;
archived accounts are faded.

## Usage

```jsx
<AccountCard account={account} onEdit={(a) => openEditor(a)} />
```

## Props

| Prop      | Type                  | Description |
|-----------|-----------------------|-------------|
| `account` | `object`              | An account from `GET /api/accounts` (`name`, `type`, `color`, `balance`, `transactionCount`, `archived`). |
| `onEdit`  | `(account) => void`   | Optional. Shows an **Edit** button that calls it. |

The color strip uses the CSS variable `--account-color`, set inline from
`account.color` (falls back to the accent color).
