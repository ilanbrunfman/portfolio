# DeckNav

Two-tier bottom navigation for the deck:

- **Main row** — top-level deck nodes, with an accent pill that slides
  (GSAP) to the active item.
- **Secondary row** — children of the active section. Hidden when there
  are none (v1 deck is flat), shown automatically once nodes get `children`.

---

## Import

```js
import DeckNav from './components/DeckNav/DeckNav'
```

---

## Basic Usage

```jsx
<DeckNav
    mainNodes={deck}
    activeMainId={mainId}
    secondaryNodes={secondaryNodes}  // treeById[activeMainId]?.children ?? []
    activeId={current.id}
    onSelect={goToId}
/>
```

---

## Props

| Prop             | Type                   | Default | Description |
|------------------|------------------------|---------|-------------|
| `mainNodes`      | `Array<{ id, title }>` | —       | Top-level deck nodes |
| `activeMainId`   | `string`               | —       | Highlights the main item + positions the indicator |
| `secondaryNodes` | `Array<{ id, title }>` | `[]`    | Children of the active section |
| `activeId`       | `string`               | —       | Current slide id (highlights the sub-item) |
| `onSelect`       | `(id: string) => void` | —       | Called with the clicked node id |

---

## How It Works

- The indicator is positioned from the active button's `offsetLeft` /
  `offsetWidth`; set instantly on first render (and with reduced motion),
  tweened afterwards.
- Active items get `aria-current="true"`.

---

## Styling

`DeckNav.scss` — block `.isa-nav2` with `__main`, `__indicator`, `__item`,
`__secondary`, `__subitem`. Colors come from `--accent` on `.isa-app`.
