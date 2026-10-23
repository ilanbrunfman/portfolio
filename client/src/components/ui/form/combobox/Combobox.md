# Combobox

A text input with a suggestion list. People can **type anything** or **pick a
suggestion**; either way the value is plain text. Follows the WAI-ARIA
combobox pattern, so it works with the keyboard and screen readers.

---

## Import

```js
import Combobox from '@/components/ui/form/combobox/Combobox'
```

---

## Basic usage

```jsx
const [title, setTitle] = useState('')

<Combobox
    label="Title"
    size="lg"
    value={title}
    onChange={setTitle}
    options={['Update resume', 'Call mom', 'Back up laptop']}
    placeholder="What needs to be done?"
    error={error}
/>
```

(As used on the **New Todo** form, `pages/todos/new/New.jsx`.)

---

## Props

| Prop             | Type                      | Default              | Notes |
|------------------|---------------------------|----------------------|-------|
| `id`             | `string`                  | auto                 | Input id; generated with `useId` if omitted. |
| `value`          | `string`                  | —                    | Controlled value. |
| `onChange`       | `(value: string) => void` | —                    | Called with the new text, typed or picked (not an event). |
| `options`        | `string[]`                | —                    | Suggestions. |
| `label`          | `ReactNode`               | —                    | Visible label (via [`Field`](../field/Field.md)). |
| `hint`           | `ReactNode`               | —                    | Helper text under the input. |
| `error`          | `ReactNode`               | —                    | Error message; marks the input `aria-invalid`. |
| `size`           | `'md' \| 'lg'`            | `'md'`               | `'lg'` is the larger title style. |
| `className`      | `string`                  | `''`                 | Extra classes on the `<input>`. |
| `fieldClassName` | `string`                  | `''`                 | Extra classes on the field wrapper. |
| `toggleLabel`    | `string`                  | `'Show suggestions'` | Accessible name for the caret button. |

Any other props (`placeholder`, `autoFocus`, …) are passed to the `<input>`.

---

## Behaviour

- The list opens on focus, while typing, or from the caret button.
- Typing filters to suggestions that **contain** the text; the matching part
  is highlighted. If the text exactly matches a suggestion (e.g. one was just
  picked), the full list shows so it's easy to switch.
- No matches → the list hides and the typed text is kept as-is.
- Clicking outside closes the list.

## Keyboard

| Key       | Action |
|-----------|--------|
| ↓ / ↑     | Open the list / move through suggestions (wraps). |
| Enter     | Pick the highlighted suggestion. With nothing highlighted, the form submits as usual. |
| Escape    | Close the list (the text is kept). |
| Tab       | Close the list and move on. |
