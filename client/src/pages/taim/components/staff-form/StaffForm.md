# StaffForm

Add a person to the roster or change one (step 8.1, **Staff** screen,
Manager only). Meant to sit inside a `Modal`.

Fields: **Name**, **Role** (Manager, Chef, Cook, Host, Waiter), **Phone**,
**Hourly rate** (typed as dollars, sent as cents; pay information, only the
Manager sees it), **Start date**, and for a new person their first
4-digit **PIN** (unique among the people working here: the server refuses
one someone else has). Changing a PIN later is its own action (Set PIN).

## Usage

```jsx
<Modal isOpen={open} onClose={close} title="Add person">
    <StaffForm person={null} onSave={roster.add} onDone={close} />
</Modal>
```

## Props

| Prop     | Type                  | Description |
|----------|-----------------------|-------------|
| `person` | `object \| null`      | A roster row to edit, or `null` to add someone (then a PIN is asked). |
| `onSave` | `(body) => Promise`   | `{ name, role, phone, hourlyRate, startDate, pin? }`; throws with `err.fields`. |
| `onDone` | `() => void`          | After saving, and on Cancel. |
