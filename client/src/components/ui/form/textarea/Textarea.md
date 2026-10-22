# Textarea

Multi-line text input with an optional label, hint and error, laid out by
[`Field`](../field/Field.md). `onChange` receives the native event.

---

## Import

```js
import Textarea from '@/components/ui/form/textarea/Textarea'
```

---

## Usage

```jsx
<Textarea
    label="Description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder="Add more detail (optional)"
    rows={5}
/>
```

---

## Props

| Prop             | Type        | Default | Description |
|------------------|-------------|---------|-------------|
| `id`             | `string`    | auto    | Textarea id; generated with `useId` if omitted. |
| `label`          | `ReactNode` | —       | Visible label. |
| `hint`           | `ReactNode` | —       | Helper text under the textarea. |
| `error`          | `ReactNode` | —       | Error message; marks the textarea `aria-invalid`. |
| `rows`           | `number`    | `4`     | Visible rows (it can still be resized vertically). |
| `className`      | `string`    | `''`    | Extra classes on the `<textarea>`. |
| `fieldClassName` | `string`    | `''`    | Extra classes on the field wrapper. |

Any other prop (`value`, `onChange`, `placeholder`, …) passes through to the
`<textarea>`.
