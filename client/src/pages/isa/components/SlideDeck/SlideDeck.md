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
/>
```

---

## Props

| Prop     | Type       | Default | Description |
|----------|------------|---------|-------------|
| `slide`  | `object`   | —       | Deck node; `slide.component` is a key of `SLIDE_COMPONENTS` |
| `data`   | `object`   | —       | Product data, passed straight to the slide as `data` |
| `index`  | `number`   | —       | Position in the flattened deck — drives animation direction |
| `onNext` | `function` | —       | Swipe left / `ArrowRight` |
| `onPrev` | `function` | —       | Swipe right / `ArrowLeft` |

---

## How It Works

- **Direction** comes from the index delta (`index < previous` → slide in
  from the left), so it's right whether navigation came from a swipe,
  keys, `DeckNav`, the menu or the URL.
- **Swipe**: a horizontal drag of at least `SWIPE_THRESHOLD` (50px).
  Vertical-dominant drags are ignored so slide content can still scroll.
- **Keys** are bound once on `window`; latest handlers are read via a ref.
- `key={slide.id}` remounts the slide on change, resetting its local state.
- Respects `prefers-reduced-motion` (no entrance animation).

---

## Adding a slide

1. Create `slides/MySlide.jsx` receiving `{ data }`.
2. Register it in `slides/index.js` → `SLIDE_COMPONENTS.mySlide`.
3. Add `{ id, title, component: 'mySlide' }` to `deck` in the data file.

---

## Notes

- Pointer events from **inside a slide bubble up here**. Interactive
  content that drags (carousels, 3D viewers…) must call
  `e.stopPropagation()` on its pointer events, or a drag will flip slides.

---

## Styling

`SlideDeck.scss` — `.isa-stage` (flex container, `touch-action: pan-y`)
and `.isa-slide` (scrollable, padded slide area).
