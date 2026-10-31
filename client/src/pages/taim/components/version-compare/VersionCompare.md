# VersionCompare

Two menu versions side by side (**Menu → Versions → Compare with current**):
income per day, average bill, bills per day, total income and how many
dishes came back, with the change (green = the newer menu did better; for
returns, fewer is better). Below: what changed in the dishes from the
older to the newer one (`GET /menu/versions/compare`). Per-day figures make
menus that ran for different lengths comparable. Meant to sit inside a
`Modal`.

## Usage

```jsx
<Modal isOpen={Boolean(comparing)} onClose={close} title="Compare menus" size="lg">
    <VersionCompare older={comparing} newer={active} loadChanges={versions.compare} />
</Modal>
```

## Props

| Prop          | Type                                  | Description |
|---------------|---------------------------------------|-------------|
| `older`       | `object`                              | A version from `GET /menu/versions`. |
| `newer`       | `object`                              | The other one (usually the menu in use). |
| `loadChanges` | `(from, to) => Promise<object[]>`     | `useMenuVersions().compare`. |
