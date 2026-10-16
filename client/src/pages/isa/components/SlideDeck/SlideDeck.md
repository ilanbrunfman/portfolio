# SlideDeck

The slide stage. Renders the current slide component, animates it in
(GSAP) based on navigation direction, and handles **swipe** (pointer)
and **arrow-key** navigation.

---

## Import

```js
import SlideDeck from './components/SlideDeck/SlideDeck'
```

---

## Basic Usage

```jsx
<SlideDeck
    slide={current}          // { id, title, component }
    data={lumvera}
    index={currentIndex}
    onNext={goNext}
    onPrev={goPrev}
    onNavigate={goTo}
    getSlide={(id) => byId[id]}
/>
```

---

## Props

| Prop     | Type       | Default | Description |
|----------|------------|---------|-------------|
| `slide`      | `DeckSlide`            | —       | Current slide from `buildDeck`; `slide.component` is a key of `SLIDE_COMPONENTS` |
| `data`       | `object`               | —       | Product data, passed straight to the slide |
| `index`      | `number`               | —       | Position in the flattened deck — drives animation direction |
| `onNext`     | `function`             | —       | Swipe left / `ArrowRight` |
| `onPrev`     | `function`             | —       | Swipe right / `ArrowLeft` |
| `onNavigate` | `(id: string) => void` | —       | Jump to any slide — passed down to slides |
| `getSlide`   | `(id: string) => DeckSlide` | —  | Look up any slide by id — passed down to slides |

### Props every slide receives

| Prop         | Description |
|--------------|-------------|
| `data`       | Product data (`lumvera`) |
| `slide`      | The current `DeckSlide` — `number`, `title`, `parentId`, `children` |
| `onNavigate` | Go to a slide by id (overview tiles use this to open children) |
| `getSlide`   | Resolve another slide by id — e.g. `getSlide('efficacy-primary').number` → `'03.1'` for cross-links like "Go to 03.1 Primary endpoint" (the Summary slide uses it) |

---

## How It Works

- **Direction** comes from the index delta (`index < previous` → slide in
  from the left), so it's right whether navigation came from a swipe,
  keys, `DeckNav`, the menu or the URL.
- **Order** is the flattened deck in preorder: a parent overview, then its
  children, then the next section (`03 → 03.1 → 03.2 → 03.3 → 04`).
- **Swipe**: a horizontal drag of at least `SWIPE_THRESHOLD` (50px).
  Vertical-dominant drags are ignored so slide content can still scroll.
- **Keys** are bound once on `window`; latest handlers are read via a ref.
- `key={slide.id}` remounts the slide on change, resetting its local state.
- Respects `prefers-reduced-motion` (no entrance animation).

---

## Adding a slide

1. Create the slide receiving `{ data, slide, onNavigate, getSlide }`:
   - a **top-level tile** → `slides/<section>/<Section>Slide.jsx`
   - a **child** of a tile → `slides/<section>/views/MySlide.jsx`

   ```
   slides/efficacy/
   ├─ EfficacySlide.jsx          ← parent overview (renders SectionOverview)
   └─ views/
      ├─ PrimaryEndpointSlide.jsx
      ├─ ResponseOverTimeSlide.jsx
      └─ StudyDesignSlide.jsx
   ```
2. Register it in `slides/index.js` → `SLIDE_COMPONENTS.mySlide`.
3. Add `{ id, title, component: 'mySlide' }` to `deck` in the data file —
   top level for a new tile, or inside a parent's `children` (with a
   `summary` for its overview tile) for a sub-slide.
4. A **parent** slide should render `SectionOverview` so its children
   get tiles.

---

## Notes

- Pointer events from **inside a slide bubble up here**. Interactive
  content that drags (carousels, 3D viewers…) must call
  `e.stopPropagation()` on its pointer events, or a drag will flip slides.

---

## Styling

`SlideDeck.scss` — `.isa-stage` (flex container, `touch-action: pan-y`)
and `.isa-slide` (scrollable, padded slide area).
