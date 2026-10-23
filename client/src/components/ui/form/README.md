# Form components

Reusable form controls. Each one lives in its own folder (`.jsx` + `.md`, plus
`.scss` when it needs its own visuals). Shared field styling such as label,
input, textarea, hint and error comes from the global
`assets/styles/shared/forms.scss`.

| Component | Path | What it's for |
|-----------|------|---------------|
| [Field](field/Field.md) | `form/field/Field` | Label → control → hint/error wrapper; used by the controls below. |
| [Input](input/Input.md) | `form/input/Input` | Single-line text. |
| [Textarea](textarea/Textarea.md) | `form/textarea/Textarea` | Multi-line text. |
| [Combobox](combobox/Combobox.md) | `form/combobox/Combobox` | Type anything or pick from suggestions. |
| [Checkbox](checkbox/Checkbox.md) | `form/checkbox/Checkbox` | On/off, with or without a visible label. |
| [RadioGroup](radio/RadioGroup.md) | `form/radio/RadioGroup` | One choice from a few options. |
| [ProgressBar](progress-bar/ProgressBar.md) | `form/progress-bar/ProgressBar` | Show how far along something is. |

**Conventions**

- `label`, `hint` and `error` work the same way on every text control.
  `error` replaces the hint and sets `aria-invalid`.
- `Input`, `Textarea` and `Checkbox` pass the native event to `onChange`.
  `Combobox` and `RadioGroup` pass the new **value**, since a value can come
  from picking as well as typing.
- `id` is optional everywhere; one is generated with `useId` when it's left out.
