# SideNavLayout

Page layout with a labelled icon navigation, used by Bank, Todos and Ta'im:

- **Tablet and desktop (≥ 769px):** a fixed sidebar on the left (12rem),
  each item an icon with its label beside it. Links at the top, actions
  (e.g. Log out) pushed to the bottom.
- **Phone (≤ 768px):** a fixed tab bar along the bottom, each item an icon
  with a short label centred under it (keeps clear of the iPhone home
  indicator).

The content area reserves the nav's space (`padding-left` on wide screens,
`padding-bottom` on phones), so content never sits under the nav. It's a
flex column at least one screen tall, so a child with `flex: 1` fills the
remaining height (handy for centering a card).

## Usage

```jsx
<SideNavLayout
    label="Bank"
    links={[
        { to: '/', icon: 'IconHome', label: 'Portfolio', shortLabel: 'Home', end: true },
        { to: '/bank', icon: 'IconCards', label: 'Accounts' },
    ]}
    actions={[{ icon: 'IconSignOut', label: 'Log out', onClick: logout }]}
>
    <Outlet />
</SideNavLayout>
```

## Props

| Prop       | Type | Description |
|------------|------|-------------|
| `label`    | `string` | Accessible name of the `<nav>`. |
| `links`    | `{ to, icon, label, shortLabel?, end? }[]` | `NavLink`s. The active one is filled with the accent color. `end` = active only on that exact URL (otherwise also on sub-pages). |
| `actions`  | `{ icon, label, shortLabel?, onClick }[]` | Optional buttons at the bottom of the sidebar (in line with the links on phones). |
| `children` | `ReactNode` | The page content. |

`label` shows beside the icon in the sidebar and is the item's `aria-label`.
The phone tab bar has little room per item, so it shows `shortLabel` when
given (e.g. "Home" for "Portfolio"), otherwise `label`, cut with "…" if
it's still too long. Keep the short label a word from the full one, so voice
control ("click Home") still matches. `icon` is a name from the `Icon` registry.
