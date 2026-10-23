# SideNavLayout

Page layout with an icon navigation, in the same style as the Todos nav:

- **Tablet and desktop (≥ 769px):** a fixed sidebar on the left, links at the
  top and actions (e.g. Log out) pushed to the bottom.
- **Phone (≤ 768px):** a fixed tab bar along the bottom (keeps clear of the
  iPhone home indicator).

The content area reserves the nav's space (`padding-left` on wide screens,
`padding-bottom` on phones), so content never sits under the nav. It's a
flex column at least one screen tall, so a child with `flex: 1` fills the
remaining height (handy for centering a card).

## Usage

```jsx
<SideNavLayout
    label="Bank"
    links={[
        { to: '/', icon: 'IconHome', label: 'Portfolio home', end: true },
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
| `links`    | `{ to, icon, label, end? }[]` | `NavLink`s. The active one is filled with the accent color. `end` = active only on that exact URL (otherwise also on sub-pages). |
| `actions`  | `{ icon, label, onClick }[]` | Optional buttons at the bottom of the sidebar (in line with the links on phones). |
| `children` | `ReactNode` | The page content. |

Items are icon-only; `label` is used for `aria-label` and the hover tooltip.
`icon` is a name from the `Icon` registry.
