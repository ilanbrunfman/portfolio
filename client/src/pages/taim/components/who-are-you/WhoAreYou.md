# WhoAreYou

The Ta'im login screen: a card per person working here (from
`GET /api/taim/staff`, Manager first). Tapping a card opens a `PinPad`;
the 4th digit calls `pick(staffId, pin)` from `StaffContext`, which posts
to `/api/taim/session`. The right PIN starts a session (an httpOnly
`taim_session` cookie with a random token; the database keeps only its
hash) and the server answers with the person's rights and screens.

A wrong PIN says how many tries are left; 5 wrong in a row lock that person
for a minute. People who left aren't listed. What each person can do is
decided by their role, and the server checks it on every request.

For portfolio visitors, the seed's people show their demo PIN on the card
("PIN 2222") and in the pad. A PIN the Manager sets later isn't shown.

## Usage

```jsx
<StaffProvider>
    <WhoAreYou />
</StaffProvider>
```

No props. Shows "Loading…" while the list loads, and the server's message
if loading fails; the pad shows why a PIN was refused.
