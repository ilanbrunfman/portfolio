# PinPad

Type a 4-digit PIN (step 8.1): used on **Who are you?** after tapping a
name. Four dots fill as digits come in; the 4th digit sends it. Big round
number keys for the tablet; the keyboard works too (a hidden numeric
input keeps focus). A wrong PIN shakes the dots, clears them and shows the
server's reason ("Wrong PIN: 3 tries left", "Too many wrong PINs: try again
in 60 s"). Meant to sit inside a `Modal`.

For portfolio visitors the person's demo PIN is shown under the dots.

## Usage

```jsx
<Modal isOpen={Boolean(person)} onClose={close} title={person.name} size="sm">
    <PinPad name={person.name} demoPin={person.demoPin} onSubmit={(pin) => pick(person.id, pin)} onCancel={close} />
</Modal>
```

## Props

| Prop       | Type                     | Description |
|------------|--------------------------|-------------|
| `name`     | `string`                 | Whose PIN. |
| `demoPin`  | `string \| null`         | Optional hint ("Demo PIN: 2222"). |
| `onSubmit` | `(pin) => Promise`       | Throws with the reason when it's refused. |
| `onCancel` | `() => void`             | "Not me". |
