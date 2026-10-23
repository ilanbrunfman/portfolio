# IsiContent

Body of the **Important Safety Information**. It renders content only —
`IsaApp` wraps it in the full-page `Modal`, whose title shows `isi.title`.

---

## Import

```js
import IsiContent from './components/IsiContent/IsiContent'
```

---

## Basic Usage

```jsx
<Modal isOpen={isiOpen} onClose={() => setIsiOpen(false)} title={lumvera.isi.title} size="full">
    <IsiContent isi={lumvera.isi} />
</Modal>
```

---

## Props

| Prop  | Type     | Default | Description |
|-------|----------|---------|-------------|
| `isi` | `object` | —       | `{ summary: string, sections: Array<{ heading, text }> }` |

---

## Data shape

```js
isi: {
    title: 'Important Safety Information',
    summary: 'Lead paragraph…',
    sections: [
        { heading: 'Contraindications', text: '…' },
    ],
}
```

---

## Styling

`IsiContent.scss` — `.isa-isi` (stacked sections; summary in bold).
