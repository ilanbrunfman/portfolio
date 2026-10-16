# SectionOverview

Layout for a **parent (overview) slide** — a tile that has children in the
deck. Renders the section header and one clickable tile per child slide
(number, title, one-line summary). Anything passed as `children` (a key
stat, a short chart) sits between the header and the tiles.

---

## Import

```js
import SectionOverview from '../../components/SectionOverview/SectionOverview'
```

(path from `slides/<section>/<Section>Slide.jsx`)

---

## Basic Usage

Every slide receives `{ data, slide, onNavigate }` from `SlideDeck`; pass
`slide` straight in as `section`.

```jsx
const DosingSlide = ({ data, slide, onNavigate }) => (
    <SectionOverview
        section={slide}
        headline={data.dosing.headline}
        lead={data.dosing.overview}
        onNavigate={onNavigate}
    />
)
```

With a highlight between header and tiles:

```jsx
<SectionOverview section={slide} headline="…" onNavigate={onNavigate}>
    <div className="surface">71% vs 6% …</div>
</SectionOverview>
```

---

## Props

| Prop         | Type                   | Default | Description |
|--------------|------------------------|---------|-------------|
| `section`    | `DeckSlide`            | —       | The parent slide (from `utils/deck.js`) — uses `number`, `title`, `children` |
| `headline`   | `ReactNode`            | —       | Main heading |
| `lead`       | `ReactNode`            | —       | Optional intro paragraph |
| `onNavigate` | `(id: string) => void` | —       | Called with the child id when a tile is clicked |
| `children`   | `ReactNode`            | —       | Optional content between header and tiles |

---

## Data

Tiles come from the deck tree — add a child to show a new tile:

```js
{
    id: 'dosing', title: 'Dosing', component: 'dosing',
    children: [
        { id: 'dosing-regimen', title: 'Regimen', component: 'dosingRegimen',
          summary: 'Initiation and maintenance' },   // ← tile subtitle
    ],
}
```

---

## How It Works

- Eyebrow shows `section.number · section.title` (e.g. `04 · Dosing`).
- Tiles are real `<button>`s in a labelled `<nav>` list, so they're
  keyboard- and screen-reader-friendly.
- Tiles stagger in with GSAP (skipped with `prefers-reduced-motion`).
- A tap on a tile doesn't trigger a slide swipe — `SlideDeck` only
  navigates on horizontal drags ≥ 50px.

---

## Styling

Layout uses `template.scss` utilities in the markup — the list is
`d-grid grid-1 grid-sm-2 grid-md-3 gap-1` (1 → 2 → 3 columns).
`SectionOverview.scss` (block `.isa-overview`) only adds the list reset and
the tile visuals: `__tile`, `__num`, `__title`, `__summary`, `__arrow`.
Colors come from `--accent*` on `.isa-app`.
