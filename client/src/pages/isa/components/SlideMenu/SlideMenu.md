# SlideMenu

Slide navigator opened from the top bar's **Slides** button. Shows every
slide as a numbered tile inside the reusable `Modal` (it renders the
modal itself), plus an optional disclaimer underneath.

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
    slides={slides}          // flattenDeck(deck)
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
| `slides`     | `Array<{ id, title }>` | —       | Flattened deck (tile number = position + 1) |
| `currentId`  | `string`               | —       | Highlights the current tile |
| `onSelect`   | `(id: string) => void` | —       | Tile clicked — close the menu here if desired |
| `onClose`    | `function`             | —       | Backdrop / Escape / close button |
| `disclaimer` | `string`               | —       | Optional small print under the grid |

---

## Notes

- Tiles are flat for v1; slides already carry `parentId`, so grouping
  child tiles under their parent later is a rendering change only.

---

## Styling

`SlideMenu.scss` — `.isa-menu` grid (2 columns, 3 from the `sm`
breakpoint) and `__tile`, `__tile-num`, `__tile-title`.
