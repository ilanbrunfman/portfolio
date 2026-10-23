# IsaTopBar

Navy top bar of the ISA shell: brand name on the left, and the three
global actions on the right — **ISI**, **References** and **Slides**.
It's purely presentational; `IsaApp` owns the open/closed state and
passes callbacks in.

---

## Import

```js
import IsaTopBar from './components/IsaTopBar/IsaTopBar'
```

---

## Basic Usage

```jsx
<IsaTopBar
    brand="Lumvera™"
    isiOpen={isiOpen}
    onToggleIsi={() => setIsiOpen((o) => !o)}
    hasReferences={refs.length > 0}
    onReferences={() => setRefsOpen(true)}
    onMenu={() => setMenuOpen(true)}
/>
```

---

## Props

| Prop            | Type         | Default | Description |
|-----------------|--------------|---------|-------------|
| `brand`         | `ReactNode`  | —       | Product name shown on the left |
| `isiOpen`       | `boolean`    | —       | Highlights the ISI button and sets `aria-expanded` |
| `onToggleIsi`   | `function`   | —       | Called when ISI is clicked |
| `hasReferences` | `boolean`    | —       | Hides the References button when the current slide has none |
| `onReferences`  | `function`   | —       | Opens the per-slide References modal |
| `onMenu`        | `function`   | —       | Opens the `SlideMenu` |

---

## Styling

`IsaTopBar.scss` — block `.isa-topbar`:

- `__bar` navy row (uses `--isa-navy` from `styles/isa.scss`)
- `__menu` light ghost buttons, `.is-active` when toggled
- `__menu--primary` outlined variant used for **Slides**

---

## Notes

- **References** is per slide — `IsaApp` decides `hasReferences` from
  `lumvera.references[slide.id]`, falling back to the parent's entry
  (`references[slide.parentId]`) for child slides without their own.
- The Slides button carries `aria-haspopup="dialog"` because it opens a modal.
