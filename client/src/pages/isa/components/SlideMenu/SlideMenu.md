# SlideMenu

Slide navigator opened from the top bar's **Slides** button. Shows every
slide as a numbered tile inside the reusable `Modal` (it renders the
modal itself), plus an optional disclaimer underneath.

Sections **with children** render as a full-width group: the overview tile
(`03 Efficacy`) followed by its indented child tiles (`03.1`, `03.2`…).
Single tiles share grid rows.

```
01 Cover    02 Mechanism of Action
┌────────────────────────────────────┐
│ 03 Efficacy                        │
│ ┃ 03.1 Primary   03.2 Over time  … │
└────────────────────────────────────┘
```

---

## Import

```js
import SlideMenu from './components/SlideMenu/SlideMenu'
```

---

## Basic Usage

```jsx
<SlideMenu
    open={menuOpen}
    sections={sections}      // buildDeck(deck).sections
    currentId={current.id}
    onSelect={goToId}         // navigates + closes the menu
    onClose={() => setMenuOpen(false)}
    disclaimer={lumvera.disclaimer}
/>
```

---

## Props

| Prop         | Type                   | Default | Description |
|--------------|------------------------|---------|-------------|
| `open`       | `boolean`              | —       | Controls the modal |
| `sections`   | `DeckSlide[]`          | —       | Top-level slides from `buildDeck` (with `number` + `children`) |
| `currentId`  | `string`               | —       | Highlights the current tile |
| `onSelect`   | `(id: string) => void` | —       | Tile clicked — close the menu here if desired |
| `onClose`    | `function`             | —       | Backdrop / Escape / close button |
| `disclaimer` | `string`               | —       | Optional small print under the grid |

---

## Notes

- Numbers come from `utils/deck.js` (`buildDeck`), so the menu, the
  overview tiles and the eyebrows always agree.
- Only one level of children is grouped visually; deeper levels would
  need a recursive group.
- The current tile gets `.is-active` and `aria-current="true"`.

---

## Styling

Layout uses `template.scss` utilities in the markup (`d-grid grid-2
grid-sm-3`, `d-flex flex-column`, `gap-*`). `SlideMenu.scss` only adds
visuals: `__group` (full-row tinted block) / `__children` (indent + rule),
`__tile` (+ `--child` modifier), `__tile-num`, `__tile-title`, `__disclaimer`.
