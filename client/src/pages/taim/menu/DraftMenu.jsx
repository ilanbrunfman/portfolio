import { useState } from 'react'
import { useMenu } from '@/pages/taim/hooks/useMenu'
import { useStaff } from '@/pages/taim/context/StaffContext'
import VersionForm from '@/pages/taim/components/version-form/VersionForm'
import PublishForm from '@/pages/taim/components/publish-form/PublishForm'
import VersionChanges from '@/pages/taim/components/version-changes/VersionChanges'
import Modal from '@/components/ui/modal/Modal'
import Button from '@/components/ui/button/Button'
import MenuBoard from './MenuBoard'
import { periodLabel, dayTimeLabel } from '@/pages/taim/utils/versions'

/**
 * Menu → Draft: the next menu.
 *   no draft  – what a draft is, and the form to start one (a copy of the
 *               menu in use)
 *   draft     – its name, season and note (Details), what changed from the
 *               menu in use, Publish (now or from a date) and
 *               Discard; below, the menu itself, fully editable
 *   scheduled – when it starts; Unschedule (back to a draft) or
 *               Discard
 *
 * @param {object} props
 * @param {object} props.versions  useMenuVersions()
 */
const DraftMenu = ({ versions }) => {
    const { can } = useStaff()
    const { data, draft } = versions
    const [modal, setModal] = useState(null) // 'details' | 'publish' | null
    const [confirmDiscard, setConfirmDiscard] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const close = () => setModal(null)

    const run = async (action) => {
        setBusy(true)
        setError('')
        try {
            await action()
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
            setConfirmDiscard(false)
        }
    }

    if (versions.error && !data) return <p className="form__error" role="alert">Couldn't load the menus: {versions.error}</p>
    if (!data) return <p role="status">Loading…</p>

    if (!draft) {
        return (
            <div className="menu-editor__start surface d-flex flex-column gap-1">
                <h3 className="menu-editor__subheading">Start the next menu</h3>
                <p className="form__hint">
                    A draft is a copy of the menu in use{versions.active ? ` (${versions.active.name})` : ''}. Change dishes, prices and
                    categories there; guests keep ordering from the menu in use until the draft is published, now or from a date.
                </p>
                <VersionForm submitLabel="Start draft" onSave={versions.startDraft} />
            </div>
        )
    }

    const scheduled = draft.status === 'SCHEDULED'
    const discardButton = confirmDiscard ? (
        <span className="d-flex flex-wrap gap-0-5">
            <Button variant="ghost" onClick={() => setConfirmDiscard(false)} disabled={busy}>Keep it</Button>
            <Button variant="secondary" onClick={() => run(() => versions.discard(draft.id))} disabled={busy}>
                {busy ? 'Discarding…' : `Yes, discard ${draft.name}`}
            </Button>
        </span>
    ) : (
        <Button variant="ghost" icon="IconTrash" onClick={() => setConfirmDiscard(true)} disabled={busy}>Discard</Button>
    )

    return (
        <div className="d-flex flex-column gap-1">
            <section className="menu-editor__version surface d-flex flex-column gap-1" aria-label={`${scheduled ? 'Scheduled' : 'Draft'}: ${draft.name}`}>
                <div className="d-flex flex-wrap align-items-start justify-between gap-1">
                    <span className="d-flex flex-column">
                        <strong className="menu-editor__version-name">
                            #{draft.number} {draft.name}{draft.season && <span className="menu-editor__season"> · {draft.season}</span>}
                        </strong>
                        <span className="form__hint">{periodLabel(draft)}{draft.createdBy && ` by ${draft.createdBy.name}`}</span>
                        {draft.note && <span className="menu-editor__note">“{draft.note}”</span>}
                    </span>
                    {!scheduled && <Button size="sm" variant="ghost" onClick={() => setModal('details')}>Details</Button>}
                </div>

                {scheduled && (
                    <p className="menu-editor__scheduled">
                        Becomes the menu in use on <strong>{dayTimeLabel(draft.activeFrom)}</strong>. It can't change any more; unschedule it to edit.
                    </p>
                )}

                <div className="d-flex flex-column gap-0-5">
                    <span className="menu-editor__label">Changes from the menu in use</span>
                    <VersionChanges changes={draft.changes ?? []} empty="None yet: change dishes below." />
                </div>

                {error && <p className="form__error" role="alert">{error}</p>}
                <div className="d-flex flex-wrap align-items-center justify-end gap-0-5">
                    {discardButton}
                    {scheduled && can('publishMenu') && (
                        <Button variant="secondary" onClick={() => run(() => versions.unschedule(draft.id))} disabled={busy}>Unschedule</Button>
                    )}
                    {!scheduled && can('publishMenu') && (
                        <Button onClick={() => setModal('publish')} disabled={busy}>Publish…</Button>
                    )}
                </div>
            </section>

            {!scheduled && <DraftBoard key={draft.id} draftId={draft.id} onChanged={versions.reload} />}

            <Modal isOpen={modal === 'details'} onClose={close} title="Draft details" size="sm">
                {modal === 'details' && <VersionForm version={draft} onSave={(body) => versions.updateVersion(draft.id, body)} onDone={close} />}
            </Modal>
            <Modal isOpen={modal === 'publish'} onClose={close} title={`Publish ${draft.name}`}>
                {modal === 'publish' && <PublishForm draft={draft} onPublish={(startsAt) => versions.publish(draft.id, startsAt)} onDone={close} />}
            </Modal>
        </div>
    )
}

/** The draft's own menu, fully editable */
const DraftBoard = ({ draftId, onChanged }) => {
    const menu = useMenu(draftId)
    return <MenuBoard menu={menu} editable onChanged={onChanged} />
}

export default DraftMenu
