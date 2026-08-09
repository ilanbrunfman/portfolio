# Button

Reusable button/link component. Renders a real `<button>` for in-page
actions, or a `<Link>`/`<a>` for navigation — same "let the data decide
the element" pattern used in `Card`: pass `to` for internal routes,
`href` for external links, or neither plus an `onClick` for a plain
action button.

---

## Import

```js
import Button from '@/components/ui/button/Button'
```

---

## Basic Usage

```jsx
<Button onClick={() => setOpen(true)}>Open modal</Button>
```

---

## Props

| Prop           | Type                                  | Default     | Description |
|----------------|----------------------------------------|-------------|-------------|
| `children`     | `ReactNode`                            | —           | Button label content |
| `variant`      | `'primary' \| 'secondary' \| 'ghost'`  | `'primary'` | Visual style |
| `size`         | `'sm' \| 'md' \| 'lg'`                 | `'md'`      | Padding/font scale |
| `icon`         | `string`                               | —           | Icon name from Icon's registry |
| `iconPosition` | `'left' \| 'right'`                    | `'left'`    | Places icon before or after label |
| `to`           | `string`                               | —           | If set, renders as a React Router `<Link>` |
| `href`         | `string`                               | —           | If set (and `to` isn't), renders as an external `<a target="_blank">` |
| `onClick`      | `function`                             | —           | Click handler (plain button mode only) |
| `type`         | `'button' \| 'submit' \| 'reset'`      | `'button'`  | Native button type |
| `disabled`     | `boolean`                              | `false`     | Disables the button (plain button mode only) |
| `className`    | `string`                               | `''`        | Extra classes appended after variant/size classes |

Any other prop (`...rest`) passes through to the underlying element —
useful for `aria-label`, `data-*` attributes, etc.

---

## Variants

```jsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
```

---

## Sizes

```jsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

---

## With Icon

Pass `icon` (a name registered in `Icon`'s registry) and optionally
`iconPosition` to control which side it renders on.

```jsx
<Button icon="chevronRight" iconPosition="right" to="/projects/task-management-app">
    View project
</Button>

<Button icon="search" iconPosition="left" variant="ghost" size="sm">
    Search
</Button>
```

### Icon-only button

Omit `children` and add an `aria-label` so screen readers have
something to announce, since there's no visible text.

```jsx
<Button icon="close" aria-label="Close modal" onClick={onClose} />
```

---

## As a Link (internal route)

```jsx
<Button to="/projects/task-management-app" variant="secondary">
    View project
</Button>
```

## As an external link

```jsx
<Button href="https://github.com/ilanbrunfman" variant="ghost" size="sm">
    GitHub
</Button>
```

## Disabled

```jsx
<Button disabled>Submitting…</Button>
```

---

## How It Works

- Exactly one of `to` / `href` should be set at a time — `to` takes
  priority if both are somehow passed.
- If neither `to` nor `href` is set, `Button` renders a plain
  `<button>` and calls `onClick` when clicked.
- `disabled` only applies in plain-button mode; links can't be
  natively disabled. If you need a disabled *link* state, either
  intercept the click (`onClick={(e) => e.preventDefault()}`) or
  conditionally render a non-interactive, disabled-styled element
  instead of `Button`.

---

## Notes

- `variant` and `size` only control which CSS classes are applied
  (`btn--primary`, `btn--md`, etc.) — the component itself has no
  opinion on what each variant should look like beyond that.
- Icon sizing should scale with `size` at the call site or within
  `Button.scss` — keep icon dimensions consistent per size variant so
  `sm`/`md`/`lg` buttons don't end up with mismatched icon-to-text
  proportions.

---

## Summary

- Single component for button, internal link, and external link
- Icon support on either side of the label
- Variant + size system driven entirely by CSS classes
