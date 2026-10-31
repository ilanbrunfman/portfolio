import { useState } from 'react'
import { useMenu } from '@/pages/taim/hooks/useMenu'
import { useMenuVersions } from '@/pages/taim/hooks/useMenuVersions'
import Tabs from '@/components/ui/tabs/Tabs'
import Button from '@/components/ui/button/Button'
import MenuBoard from './MenuBoard'
import DraftMenu from './DraftMenu'
import MenuVersions from './MenuVersions'
import { periodLabel } from '@/pages/taim/utils/versions'
import './MenuEditor.scss'

/**
 * /taim/menu – the Manager's and Chef's menu, in three tabs (step 3.1):
 *   In use   – the menu guests order from; only sold out changes here
 *   Draft    – the next menu: a copy to change (dishes, prices,
 *              categories), published (Manager or Chef) now or from a date
 *   Versions – every menu so far: when, who, income, what changed; compare
 * (The route only renders this for roles with the editMenu right; the
 * server refuses changes from anyone else.)
 */
const MenuEditor = () => {
    const versions = useMenuVersions()
    const [tab, setTab] = useState('live')
    const { draft } = versions

    // Coming back to a tab: show what's saved now (a publish changes them all)
    const changeTab = (next) => {
        setTab(next)
        versions.reload()
    }

    const items = [
        { id: 'live', label: 'In use' },
        { id: 'draft', label: draft?.status === 'SCHEDULED' ? 'Scheduled' : 'Draft' },
        { id: 'versions', label: 'Versions' },
    ]

    return (
        <div className="menu-editor d-flex flex-column gap-1">
            <h2 className="taim__heading">Menu</h2>
            <Tabs label="Menu" items={items} value={tab} onChange={changeTab} className="menu-editor__tabs">
                {(id) => (
                    <div className="menu-editor__panel">
                        {id === 'live' && <LiveMenu active={versions.active} onStartDraft={() => changeTab('draft')} hasDraft={Boolean(draft)} />}
                        {id === 'draft' && <DraftMenu versions={versions} />}
                        {id === 'versions' && <MenuVersions versions={versions} />}
                    </div>
                )}
            </Tabs>
        </div>
    )
}

/** The menu in use: which version, since when; sold out switches only */
const LiveMenu = ({ active, hasDraft, onStartDraft }) => {
    const menu = useMenu()
    return (
        <div className="d-flex flex-column gap-1">
            {active && (
                <div className="menu-editor__version surface d-flex flex-wrap align-items-center justify-between gap-1">
                    <span className="d-flex flex-column">
                        <strong className="menu-editor__version-name">
                            #{active.number} {active.name}{active.season && <span className="menu-editor__season"> · {active.season}</span>}
                        </strong>
                        <span className="form__hint">{periodLabel(active)}</span>
                        <span className="form__hint">Sold out works here. Dishes, prices and categories change in the draft.</span>
                    </span>
                    <Button size="sm" variant="secondary" onClick={onStartDraft}>
                        {hasDraft ? 'Open the draft' : 'Start a draft'}
                    </Button>
                </div>
            )}
            <MenuBoard menu={menu} />
        </div>
    )
}

export default MenuEditor
