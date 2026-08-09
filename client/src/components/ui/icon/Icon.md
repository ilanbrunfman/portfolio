# Icon Component

Reusable icon component that provides a centralized way to render SVG icons by name with consistent sizing, color, and styling support.

---

## 📦 Import

```js
import Icon from '@/components/Icon/Icon'
```

---

## 🚀 Basic Usage

```jsx
<Icon name="IconHome" />
```

---

## 📏 Size

Controls the icon dimensions (width and height).

```jsx
<Icon name="IconHome" size={16} />
<Icon name="IconHome" size={24} />
<Icon name="IconHome" size={32} />
```

> Default: `18`

---

## 🎨 Color

You can control the SVG stroke/fill color (depending on the icon implementation).

```jsx
<Icon name="IconTrash" color="red" />
<Icon name="IconUser" color="#3056d3" />
<Icon name="IconPlus" color="currentColor" />
```

> Default: `undefined` (inherits current text color)

---

## 🧵 Stroke Width

Adjusts the thickness of the icon lines.

```jsx
<Icon name="IconHome" strokeWidth={1} />
<Icon name="IconHome" strokeWidth={2} />
<Icon name="IconHome" strokeWidth={3} />
```

> Default: `2`

---

## 🎯 With ClassName

Use custom styling via CSS or Tailwind.

```jsx
<Icon name="IconHome" className="text-blue-500" />
<Icon name="IconTrash" className="hover:text-red-500" />
```

---

## 🧩 Usage in Buttons

```jsx
<button className="flex items-center gap-2">
  <Icon name="IconPlus" />
  Add Item
</button>
```

---

## 🧠 Props

| Prop         | Type     | Default | Description                        |
|--------------|----------|---------|------------------------------------|
| name         | string   | —       | Icon name (must exist in registry) |
| size         | number   | `18`    | Icon width/height                  |
| strokeWidth  | number   | `2`     | SVG stroke thickness               |
| color        | string   | —       | Icon color                         |
| className    | string   | ''      | Additional CSS classes             |
| ...props     | object   | —       | Any additional SVG props           |

---

## 🧩 Available Icons

- IconArrowLeft
- IconBrowsers
- IconCards
- IconCaretRight
- IconHome
- IconLayout
- IconList
- IconListBullets
- IconMinus
- IconMagnifyingGlass
- IconPlus
- IconSignIn
- IconSignOut
- IconTrash
- IconUser
- IconStack
- IconTable
- IconTabs
- IconX

---

## ⚠️ Notes

- If icon does not exist, nothing renders and a console warning appears.
- Icon names are case-sensitive.
- This is a wrapper around individual SVG components.

---

## 🧠 How It Works

```js
const Component = icons[name]
```

```jsx
return <Component {...props} />
```

If not found:

```js
console.warn(`Icon "${name}" does not exist!`)
return null
```

---

## ➕ Adding a New Icon

1. Create component
2. Import into Icon.jsx
3. Register in icons object
4. Use via name

---

## 🧪 Example

```jsx
<Icon
  name="IconMagnifyingGlass"
  size={20}
  strokeWidth={2}
  color="#333"
  className="hover:text-blue-500"
/>
```

---

## 🏁 Summary

- Single unified icon API
- Central registry
- Easy extension
