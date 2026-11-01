# Select

A dropdown: one choice from a list. It's a native `<select>` (keyboard,
screen readers and the phone's own picker all work), styled like `Input`
with our chevron instead of the browser's arrow. Label, hint and error work
like every other text control.

## Import

```js
import Select from '@/components/ui/form/select/Select'
```

## Usage

```jsx
const [reason, setReason] = useState('')

<Select
    label="Why the change?"
    placeholder="Pick a reason…"
    options={[
        { value: 'FORGOT_OUT', label: 'Forgot to clock out' },
        { value: 'OTHER', label: 'Other' },
    ]}
    value={reason}
    onChange={setReason}
    error={error}
/>
```

## Props

| Prop             | Type                              | Description |
|------------------|-----------------------------------|-------------|
| `options`        | `{ value, label }[]`              | The choices, in order. |
| `value`          | `string`                          | The picked value (`''` = none). |
| `onChange`       | `(value) => void`                 | Gets the **value** (like `RadioGroup`), not the event. |
| `placeholder`    | `string`                          | Optional first, empty choice ("Pick a reason…"), value `''`; shown in the hint colour. |
| `label` / `hint` / `error` | `ReactNode`             | As on `Input`. |
| `id`             | `string`                          | Optional; generated when left out. |
| `className`, `fieldClassName` | `string`             | Extra classes on the `<select>` / the field wrapper. |

Any other props (`disabled`, `name`, …) go to the `<select>`.

First used by Ta'im's time entry popup (the reason for a change).
