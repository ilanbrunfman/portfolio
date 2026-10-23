# AuthForm

Log in or sign up for the bank tracker: one form with two modes and a link
to switch. Built from the form kit (`Input`, `Button`).

- Email + password; sign up asks for 8+ characters.
- Calls `authenticate(mode, credentials)` from `AuthContext`; on success the
  provider has a user and `/bank` shows the app instead of this form.
- Server messages appear on top ("Email or password is incorrect", "An
  account with this email already exists…") or under the matching input.
- In development it shows the seeded demo login (`demo@bank.test / demo1234`).

## Usage

```jsx
<AuthProvider>
    {user ? <BankApp /> : <AuthForm />}
</AuthProvider>
```

No props. Must be rendered inside `AuthProvider`.
