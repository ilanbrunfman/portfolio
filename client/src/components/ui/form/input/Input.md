# Input

Text input with an optional label, hint and error, laid out by
[`Field`](../field/Field.md). It's a regular controlled `<input>`, so
`onChange` receives the native event.

---

## Import

```js
import Input from '@/components/ui/form/input/Input'
```

---

## Usage

```jsx
<Input
    label="Title"
    size="lg"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="Todo title"
    error={error}
/>
```

(As used on the todo edit form, `pages/todos/todo/Todo.jsx`.)

---

## Props

| Prop             | Type             | Default   | Description |
|------------------|------------------|-----------|-------------|
| `id`             | `string`         | auto      | Input id; generated with `useId` if omitted. |
| `label`          | `ReactNode`      | —         | Visible label. |
| `hint`           | `ReactNode`      | —         | Helper text under the input. |
| `error`          | `ReactNode`      | —         | Error message; marks the input `aria-invalid`. |
| `size`           | `'md' \| 'lg'`   | `'md'`    | `'lg'` is the larger title style (`form__input--title`). |
| `className`      | `string`         | `''`      | Extra classes on the `<input>`. |
| `fieldClassName` | `string`         | `''`      | Extra classes on the field wrapper. |

Any other prop (`value`, `onChange`, `type`, `placeholder`, `autoFocus`, …)
passes through to the `<input>`. `type` defaults to `"text"`.
