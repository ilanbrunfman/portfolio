import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deck, lumvera } from './data/lumvera.data'
import Modal from '@/components/ui/modal/Modal'
import IsaTopBar from './components/IsaTopBar'
import SlideDeck from './components/SlideDeck'
import DeckNav from './components/DeckNav'
import IsiContent from './components/IsiContent'
import SlideMenu from './components/SlideMenu'

// Flatten the deck tree (preorder) into the linear navigation sequence. Any
// node's `children` are included right after it, so nested tiles work later
// with no changes here.
const flattenDeck = (nodes, parentId = null, acc = []) => {
    for (const node of nodes) {
        acc.push({ id: node.id, title: node.title, component: node.component, parentId })
        if (node.children?.length) flattenDeck(node.children, node.id, acc)
    }
    return acc
}

const IsaApp = () => {
    const slides = useMemo(() => flattenDeck(deck), [])
    // id -> parentId (for finding a slide's top-level section).
    const parentOf = useMemo(
        () => Object.fromEntries(slides.map((s) => [s.id, s.parentId])),
        [slides]
    )
    // id -> tree node (for reading a section's children).
    const treeById = useMemo(() => {
        const map = {}
        const walk = (nodes) => nodes.forEach((n) => {
            map[n.id] = n
            if (n.children?.length) walk(n.children)
        })
        walk(deck)
        return map
    }, [])

    const navigate = useNavigate()
    const { slideId } = useParams()
    const [menuOpen, setMenuOpen] = useState(false)
    const [isiOpen, setIsiOpen] = useState(false)
    const [refsOpen, setRefsOpen] = useState(false)

    // The URL param is the source of truth for the current slide.
    const foundIndex = slides.findIndex((s) => s.id === slideId)
    const index = foundIndex >= 0 ? foundIndex : 0
    const current = slides[index]

    // Walk up to the top-level section the current slide belongs to.
    let activeMainId = current.id
    while (parentOf[activeMainId]) activeMainId = parentOf[activeMainId]
    const secondaryNodes = treeById[activeMainId]?.children ?? []
    const currentRefs = lumvera.references[current.id] ?? []

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
            />

            <DeckNav
                mainNodes={deck}
                activeMainId={activeMainId}
                secondaryNodes={secondaryNodes}
                activeId={current.id}
                onSelect={goToId}
            />

            <SlideMenu
                open={menuOpen}
                slides={slides}
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
