# Accordion

Reusable collapsible sections. `Accordion` is the container and
`Accordion.Item` is one section: a header button with a caret
(`IconCaretRight` via `Icon`) that rotates down when open, and a panel that
slides open with a pure-CSS height animation.

Multi-open by default: each item keeps its own state, so any number can be
open at once. Pass `open` + `onToggle` to control items from a parent
(e.g. single-open behaviour).

---

## Import

```js
import Accordion from '@/components/ui/accordion/Accordion'
// or, for the item on its own:
import { AccordionItem } from '@/components/ui/accordion/Accordion'
```

---

## Basic Usage

```jsx
<Accordion>
    <Accordion.Item title="Theme">
        <ThemeToggle />
    </Accordion.Item>
</Accordion>
```

(As used in the header's `SettingsMenu`.)

---

## Props

### `Accordion`

| Prop        | Type        | Default | Description |
|-------------|-------------|---------|-------------|
| `children`  | `ReactNode` | —       | One or more `Accordion.Item`s |
| `className` | `string`    | `''`    | Extra classes on the `.accordion` wrapper |

### `Accordion.Item`

| Prop          | Type                      | Default | Description |
|---------------|---------------------------|---------|-------------|
| `title`       | `ReactNode`               | —       | Header content — plain text or any markup (icon + text, badge…) |
| `children`    | `ReactNode`               | —       | Collapsible panel content |
| `defaultOpen` | `boolean`                 | `false` | Initial state when uncontrolled |
| `open`        | `boolean`                 | —       | Controlled open state (pass with `onToggle`) |
| `onToggle`    | `(next: boolean) => void` | —       | Called with the requested state in controlled mode |

---

## Multiple sections

```jsx
<Accordion>
    <Accordion.Item title="Shipping" defaultOpen>
        <p>Ships in 2–3 business days.</p>
    </Accordion.Item>
    <Accordion.Item title="Returns">
        <p>30-day returns, no questions asked.</p>
    </Accordion.Item>
</Accordion>
```

## Rich title

`title` takes any node, so headers can carry icons or badges. Use
`template.scss` utilities for the layout:

```jsx
<Accordion.Item
    title={
        <span className="d-flex align-items-center gap-1">
            <Icon name="IconStack" size={18} /> Layers
        </span>
    }
>
    …
</Accordion.Item>
```

## Single-open (controlled)

```jsx
const [openId, setOpenId] = useState('faq-1')

<Accordion>
    {faqs.map((faq) => (
        <Accordion.Item
            key={faq.id}
            title={faq.question}
            open={openId === faq.id}
            onToggle={(next) => setOpenId(next ? faq.id : null)}
        >
            <p>{faq.answer}</p>
        </Accordion.Item>
    ))}
</Accordion>
```

---

## How It Works

- The header is a real `<button>` with `aria-expanded` / `aria-controls`;
  the panel is a `role="region"` labelled by the header.
- **Animation:** the panel animates `grid-template-rows: 0fr → 1fr`, so
  there's no fixed `max-height` to maintain. Turned off under
  `prefers-reduced-motion`.
- **Collapsed content stays mounted** (the animation needs it in the DOM)
  and is made `inert`, so it's out of the tab order and the accessibility
  tree. Anything expensive inside still runs while hidden — gate it on the
  open state or render it conditionally if that matters.
- The open state is reflected as `.is-open` on `.accordion__item`, which
  rotates the caret 90° (right → down).
- Needs ~2023+ browsers for the animated `grid-template-rows` and `inert`
  (Chrome 107 / Safari 16 / Firefox 120); older ones snap open/closed.

---

## Styling

`Accordion.scss` — block `.accordion`:

- `__item` sections, divided by a top border (none on the first)
- `__header` the toggle button (14px, `--accent-bg` on hover)
- `__title`, `__chevron` (the caret icon)
- `__panel` → `__panel-inner` → `__panel-content` the animated panel

To resize it for a specific context, scope overrides under a parent class
instead of changing the global styles:

```scss
.my-context .accordion__header {
    font-size: 1.05rem;
    padding: 0.75rem 0.5rem;
}
```

---

## Notes

- The caret is `Icon name="IconCaretRight"` — change it in `Accordion.jsx`
  and every accordion in the app follows.
- Current uses: header `SettingsMenu` (Theme).

---

## Summary

- Container + item compound API (`Accordion.Item`, or named `AccordionItem`)
- Uncontrolled (multi-open) by default, controlled when you need it
- Accessible button/region pairing, `inert` when collapsed
- CSS-only height animation, reduced-motion aware
