# ProgressBar

A horizontal progress bar with an optional label and readout. It's exposed to
screen readers as `role="progressbar"`, with the label as its name and the
readout as its value text.

---

## Import

```js
import ProgressBar from '@/components/ui/form/progress-bar/ProgressBar'
```

---

## Usage

```jsx
<ProgressBar
    label="Completed"
    value={done}
    max={todos.length}
    valueText={`${done} of ${todos.length}`}
/>
```

(As used above the Recent Todos list, `pages/todos/recent/Recent.jsx`.)

---

## Props

| Prop        | Type        | Default | Description |
|-------------|-------------|---------|-------------|
| `value`     | `number`    | —       | Current amount (clamped to 0–`max`). |
| `max`       | `number`    | `100`   | The amount that means "full". |
| `label`     | `ReactNode` | —       | Text above the bar; also its accessible name. |
| `valueText` | `string`    | `"N%"`  | Readout and screen-reader value, e.g. `"3 of 10"`. |
| `showValue` | `boolean`   | `true`  | Show the readout. |
| `className` | `string`    | `''`    | Extra classes on the wrapper. |

The fill animates with a `scaleX` transform. The animation is skipped when
reduced motion is on.
