# Tabs

Reusable, accessible tab strip with **one shared panel**. The panel stays
mounted when the active tab changes and renders `children` for the active
tab, so its content can animate between datasets (e.g. a bar chart morphing
from one endpoint to the next) instead of being torn down and remounted.

Uncontrolled by default; pass `value` + `onChange` to control it from a
parent.

---

## Import

```js
import Tabs from '@/components/ui/tabs/Tabs'
```

---

## Basic Usage

```jsx
<Tabs
    label="Primary endpoints"
    items={[
        { id: 'pasi90', label: 'PASI 90' },
        { id: 'pasi75', label: 'PASI 75' },
    ]}
    defaultValue="pasi90"
>
    {(activeId) => <EndpointChart endpoint={byId[activeId]} />}
</Tabs>
```

(As used on the ISA **Primary endpoints** slide,
`pages/isa/slides/efficacy/views/PrimaryEndpointSlide.jsx`.)

---

## Props

| Prop           | Type                                               | Default         | Description |
|----------------|----------------------------------------------------|-----------------|-------------|
| `items`        | `{ id: string, label: ReactNode }[]`               | —               | Tabs, in display order |
| `label`        | `string`                                           | —               | Accessible name for the tablist (`aria-label`) |
| `children`     | `ReactNode \| (activeId: string) => ReactNode`     | —               | Panel content; use the function form to render per tab |
| `defaultValue` | `string`                                           | first item's id | Initial active tab when uncontrolled |
| `value`        | `string`                                           | —               | Controlled active tab (pass with `onChange`) |
| `onChange`     | `(id: string) => void`                             | —               | Called with the newly selected id (both modes) |
| `className`    | `string`                                           | `''`            | Extra classes on the `.tabs` wrapper |

---

## Controlled

```jsx
const [tab, setTab] = useState('pasi90')

<Tabs label="Endpoints" items={items} value={tab} onChange={setTab}>
    <Chart endpoint={tab} />
</Tabs>
```

---

## Accessibility

- `role="tablist"` / `role="tab"` / `role="tabpanel"` with `aria-selected`,
  `aria-controls` and `aria-labelledby` wired up via `useId`.
- Roving tabindex: only the active tab is in the tab order; **← / →** move
  between tabs (wrapping), **Home / End** jump to the first / last.
- Selection follows focus (automatic activation) — fine here because
  switching tabs is cheap and non-destructive.
- The panel is focusable (`tabIndex=0`) so keyboard users can reach content
  that has no focusable children (like a chart).

---

## Notes

- Styled as a segmented control: tabs sit on a tinted pill track and an
  accent pill (`.tabs__indicator`) slides to the active tab via GSAP —
  same pattern as the ISA `DeckNav` main row. It snaps on first paint, with
  `prefers-reduced-motion`, and whenever the strip resizes (font load,
  viewport change).
- One panel for all tabs is deliberate. If you need each tab's content to
  keep its own state while hidden, render per-tab panels yourself instead.
- The strip scrolls horizontally when labels don't fit, rather than wrapping.
