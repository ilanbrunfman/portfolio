# Field

The wrapper every form control uses: **label → control → hint or error**.
You rarely use it directly. `Input`, `Textarea` and `Combobox` render it for
you when you pass `label`, `hint` or `error`. Use it yourself only to give a
custom control the same layout.

Styling comes from the global form classes in
`assets/styles/shared/forms.scss` (`form__field`, `form__label`,
`form__hint`, `form__error`).

---

## Import

```js
import Field from '@/components/ui/form/field/Field'
import { fieldAria } from '@/components/ui/form/field/fieldAria'
```

---

## Usage (custom control)

```jsx
<Field id="color" label="Color" hint="Pick a brand color" error={error}>
    <input id="color" type="color" {...fieldAria('color', { hint: 'Pick a brand color', error })} />
</Field>
```

`fieldAria(id, { hint, error })` returns `aria-invalid` and
`aria-describedby`, so screen readers announce the hint or error with the
control.

---

## Props

| Prop        | Type        | Default | Description |
|-------------|-------------|---------|-------------|
| `id`        | `string`    | —       | The control's id; the label's `htmlFor` points at it. |
| `label`     | `ReactNode` | —       | Visible label. |
| `hint`      | `ReactNode` | —       | Helper text under the control. Hidden while there's an error. |
| `error`     | `ReactNode` | —       | Error message (`role="alert"`). |
| `className` | `string`    | `''`    | Extra classes on the wrapper. |
| `children`  | `ReactNode` | —       | The control. |
