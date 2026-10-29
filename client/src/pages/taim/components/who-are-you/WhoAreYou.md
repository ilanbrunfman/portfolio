# WhoAreYou

The Ta'im "login" screen: a card per staff member (from `GET /api/taim/staff`,
Manager first). Clicking a card calls `pick(staffId)` from `StaffContext`,
which posts to `/api/taim/session`; the server answers with the person's
rights and screens and sets the `taim_staff` cookie.

There are no passwords. Picking a person is the login; what they can do is
decided by their role, and the server checks it on every request.

## Usage

```jsx
<StaffProvider>
    <WhoAreYou />
</StaffProvider>
```

No props. Shows "Loading…" while the list loads, and the server's message if
loading or picking fails. While a pick is in flight every card is disabled
and the picked one is marked `aria-busy`.
