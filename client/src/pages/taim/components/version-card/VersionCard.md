# VersionCard

One menu version on **Menu → Versions**:

- `#2 Autumn menu` with its season and tags: **Current** (the menu in use),
  **Draft**, **Scheduled**, **Best income** (most income per day of all
  versions that were in use), **Last** (the menu before the current one).
- When it was in use (`Sat 5 Sep – Sat 10 Oct · 35 days`, `In use since …`,
  `Starts Sun 9 Nov, 11:00`), who made and published it, and its note.
- For a menu that was in use: income, per day, bills, average bill; dishes
  sold, how many came back (%), top three dishes. Income is what closed
  bills paid for its dishes (not dishes that came back or were wasted, nor
  free ones).
- Folded: what changed from the version it was based on (`VersionChanges`).
- **View dishes** (when `onView` is given): the version's dishes, read only.
- **Compare with current** (when `onCompare` is given).
- **Use this menu again** (when `onUseAgain` is given: older menus, for
  Manager and Chef). Asks once, then the menu comes back as a new version
  in use from now ("Back from #2"); the current one is archived.

## Usage

```jsx
<VersionCard
    version={version}
    tags={versionTags(version, data)}
    basedOnName="Summer menu"
    onCompare={() => setComparing(version)}
/>
```

## Props

| Prop          | Type         | Description |
|---------------|--------------|-------------|
| `version`     | `object`     | From `GET /api/taim/menu/versions` (with `stats`, `changes`, `dishCount`). |
| `tags`        | `{ label, tone }[]` | From `versionTags()` in `utils/versions.js`. |
| `basedOnName` | `string`     | Optional. Names the version in "N changes from …". |
| `onView`      | `() => void` | Optional. Shows **View dishes**. |
| `onCompare`   | `() => void` | Optional. Shows **Compare with current**. |
| `onUseAgain`  | `() => Promise` | Optional. Shows **Use this menu again** with a confirm step; throws on failure. |
