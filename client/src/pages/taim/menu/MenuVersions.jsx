import { useState } from 'react'
import { useStaff } from '@/pages/taim/context/StaffContext'
import VersionCard from '@/pages/taim/components/version-card/VersionCard'
import VersionCompare from '@/pages/taim/components/version-compare/VersionCompare'
import { useMenu } from '@/pages/taim/hooks/useMenu'
import MenuBoard from './MenuBoard'
import Modal from '@/components/ui/modal/Modal'
import { versionTags } from '@/pages/taim/utils/versions'

/**
 * Menu → Versions: every menu, newest first (the draft on top), as cards
 * with tags, dates, income and changes. "View dishes" shows a menu's
 * dishes (read only); "Compare with current" opens two
 * menus side by side; "Use this menu again" (Manager, Chef) brings an older
 * menu back as the menu in use.
 *
 * @param {object} props
 * @param {object} props.versions  useMenuVersions()
 */
const MenuVersions = ({ versions }) => {
    const { can } = useStaff()
    const { data, active } = versions
    const [comparing, setComparing] = useState(null) // the version compared with the one in use
    const [viewing, setViewing] = useState(null) // the version whose dishes are shown

    if (versions.error && !data) return <p className="form__error" role="alert">Couldn't load the menus: {versions.error}</p>
    if (!data) return <p role="status">Loading…</p>

    const nameOf = (id) => data.versions.find((v) => v.id === id)?.name
    // The older one on the left
    const pair = comparing && active ? [comparing, active].sort((a, b) => a.number - b.number) : null

    return (
        <div className="d-flex flex-column gap-1">
            <p className="form__hint">
                Income is what closed bills paid for each menu&apos;s dishes. Per day makes menus that ran for different lengths comparable.
            </p>
            {data.versions.map((version) => (
                <VersionCard
                    key={version.id}
                    version={version}
                    tags={versionTags(version, data)}
                    basedOnName={nameOf(version.basedOnId)}
                    onView={() => setViewing(version)}
                    onCompare={active && version.id !== active.id ? () => setComparing(version) : undefined}
                    onUseAgain={version.status === 'ARCHIVED' && can('publishMenu') ? () => versions.useAgain(version.id) : undefined}
                />
            ))}
            <Modal isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing ? `#${viewing.number} ${viewing.name}` : ''}>
                {viewing && <VersionDishes versionId={viewing.id} />}
            </Modal>
            <Modal isOpen={Boolean(pair)} onClose={() => setComparing(null)} title="Compare menus" size="lg">
                {pair && <VersionCompare older={pair[0]} newer={pair[1]} loadChanges={versions.compare} />}
            </Modal>
        </div>
    )
}

/** A version's dishes in the same accordion as the menu in use, read only */
const VersionDishes = ({ versionId }) => {
    const menu = useMenu(versionId)
    return <MenuBoard menu={menu} readOnly />
}

export default MenuVersions
