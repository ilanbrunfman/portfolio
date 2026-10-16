import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deck, lumvera } from './data/lumvera.data'
import { buildDeck, sectionOf } from './utils/deck'
import Modal from '@/components/ui/modal/Modal'
import IsaTopBar from './components/IsaTopBar/IsaTopBar'
import SlideDeck from './components/SlideDeck/SlideDeck'
import DeckNav from './components/DeckNav/DeckNav'
import IsiContent from './components/IsiContent/IsiContent'
import SlideMenu from './components/SlideMenu/SlideMenu'
import './styles/isa.scss'

const IsaApp = () => {
    const { slides, sections, byId } = useMemo(() => buildDeck(deck), [])

    const navigate = useNavigate()
    const { slideId } = useParams()
    const [menuOpen, setMenuOpen] = useState(false)
    const [isiOpen, setIsiOpen] = useState(false)
    const [refsOpen, setRefsOpen] = useState(false)

    // The URL param is the source of truth for the current slide.
    const foundIndex = slides.findIndex((s) => s.id === slideId)
    const index = foundIndex >= 0 ? foundIndex : 0
    const current = slides[index]

    // Secondary nav = the active section's overview + its children.
    const section = sectionOf(current, byId)
    const secondaryNodes = section.children.length
        ? [{ id: section.id, title: 'Overview' }, ...section.children]
        : []
    // A child slide without its own references falls back to its parent's.
    const currentRefs =
        lumvera.references[current.id] ?? lumvera.references[current.parentId] ?? []

    const goTo = (id) => navigate(`/isa/${id}`)
    const goNext = () => {
        if (index < slides.length - 1) goTo(slides[index + 1].id)
    }
    const goPrev = () => {
        if (index > 0) goTo(slides[index - 1].id)
    }
    const goToId = (id) => {
        goTo(id)
        setMenuOpen(false)
    }

    return (
        <div className="isa-app">
            <IsaTopBar
                brand={`${lumvera.name}${lumvera.tm}`}
                isiOpen={isiOpen}
                onToggleIsi={() => setIsiOpen((o) => !o)}
                onReferences={() => setRefsOpen(true)}
                hasReferences={currentRefs.length > 0}
                onMenu={() => setMenuOpen(true)}
            />

            <SlideDeck
                slide={current}
                data={lumvera}
                index={index}
                onNext={goNext}
                onPrev={goPrev}
                onNavigate={goTo}
            />

            <DeckNav
                mainNodes={sections}
                activeMainId={section.id}
                secondaryNodes={secondaryNodes}
                activeId={current.id}
                onSelect={goToId}
            />

            <SlideMenu
                open={menuOpen}
                sections={sections}
                currentId={current.id}
                onSelect={goToId}
                onClose={() => setMenuOpen(false)}
                disclaimer={lumvera.disclaimer}
            />

            <Modal
                isOpen={isiOpen}
                onClose={() => setIsiOpen(false)}
                title={lumvera.isi.title}
                size="full"
            >
                <IsiContent isi={lumvera.isi} />
            </Modal>

            <Modal isOpen={refsOpen} onClose={() => setRefsOpen(false)} title="References" size="md">
                <ol
                    className="d-flex flex-column gap-1"
                    style={{ margin: 0, paddingLeft: '1.3rem', color: 'var(--text)', lineHeight: 1.6 }}
                >
                    {currentRefs.map((ref) => (
                        <li key={ref}>{ref}</li>
                    ))}
                </ol>
            </Modal>
        </div>
    )
}

export default IsaApp
