# RadioGroup

A labelled set of radio buttons for picking one option. It renders a
`<fieldset>`, with the label as its `<legend>`. Arrow keys move between
options natively.

---

## Import

```js
import RadioGroup from '@/components/ui/form/radio/RadioGroup'
```

---

## Usage

```jsx
const [priority, setPriority] = useState('normal')

<RadioGroup
    label="Priority"
    direction="row"
    value={priority}
    onChange={setPriority}
    options={[
        { value: 'low', label: 'Low' },
        { value: 'normal', label: 'Normal' },
        { value: 'high', label: 'High' },
    ]}
/>
```

---

## Props

| Prop        | Type                                                      | Default    | Description |
|-------------|-----------------------------------------------------------|------------|-------------|
| `label`     | `ReactNode`                                               | —          | Group label (`<legend>`). |
| `options`   | `{ value: string, label: ReactNode, disabled?: boolean }[]` | —        | The choices. |
| `value`     | `string`                                                  | —          | Selected value (controlled). |
| `onChange`  | `(value: string) => void`                                 | —          | Called with the picked value (not an event). |
| `name`      | `string`                                                  | auto       | Radio `name`; generated with `useId` if omitted. |
| `direction` | `'column' \| 'row'`                                       | `'column'` | Stack options vertically or in a wrapping row. |
| `className` | `string`                                                  | `''`       | Extra classes on the `<fieldset>`. |
