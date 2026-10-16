# DeckNav

Two-tier bottom navigation for the deck:

- **Secondary row (top)** — the active section's sub-slides: its
  **Overview** (the parent slide) followed by its children. Hidden for
  sections without children (Cover, MOA, Summary).
- **Main row (bottom)** — top-level deck nodes, with an accent pill that
  slides (GSAP) to the active item.

```
   (Overview) (Primary endpoint) (Response over time) …    ← secondary
 ─────────────────────────────────────────────────────
 Cover · MOA · [Efficacy] · Dosing · Safety · Summary     ← main
```

---

## Import

```js
import DeckNav from './components/DeckNav/DeckNav'
```

---

## Basic Usage

```jsx
<DeckNav
    mainNodes={sections}                       // buildDeck(deck).sections
    activeMainId={section.id}                  // sectionOf(current, byId).id
    secondaryNodes={secondaryNodes}            // [{ id: section.id, title: 'Overview' }, ...section.children]
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
| `secondaryNodes` | `Array<{ id, title }>` | `[]`    | Active section's overview + children (empty → row hidden) |
| `activeId`       | `string`               | —       | Current slide id (highlights the sub-item) |
| `onSelect`       | `(id: string) => void` | —       | Called with the clicked node id |

---

## How It Works

- The indicator is positioned from the active button's `offsetLeft` /
  `offsetWidth`; set instantly on first render (and with reduced motion),
  tweened afterwards.
- Active items get `aria-current="true"`. The main item stays active
  while you're on any of its children.
- The "Overview" entry is built in `IsaApp`, not here — `DeckNav` just
  renders whatever `secondaryNodes` it gets.

---

## Styling

`DeckNav.scss` — block `.isa-nav2` with `__secondary` (top row, hairline
below it), `__subitem`, `__main`, `__indicator`, `__item`. Colors come from `--accent` on `.isa-app`.
