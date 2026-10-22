# Checkbox

Styled checkbox: an accent fill with a white tick when checked. With `label`
it renders a clickable label row. Without one it renders only the box, so
give it an `aria-label`.

---

## Import

```js
import Checkbox from '@/components/ui/form/checkbox/Checkbox'
```

---

## Usage

```jsx
// With a visible label
<Checkbox label="Remember me" checked={remember} onChange={(e) => setRemember(e.target.checked)} />

// Box only (e.g. in a list row)
<Checkbox
    checked={todo.completed}
    onChange={() => toggleComplete(todo.id)}
    aria-label={`Mark ${todo.title} complete`}
/>
```

(The box-only form is used on the Recent Todos list, `pages/todos/recent/Recent.jsx`.)

---

## Props

| Prop        | Type        | Default | Description |
|-------------|-------------|---------|-------------|
| `label`     | `ReactNode` | —       | Visible label. Omit for a box-only checkbox. |
| `className` | `string`    | `''`    | Extra classes on the outer element (the label, or the box when there's no label). |

Any other prop (`checked`, `onChange`, `disabled`, `aria-label`, `id`, …)
passes through to the `<input type="checkbox">`.
