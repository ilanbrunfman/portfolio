import Modal from '@/components/ui/modal/Modal'
import './SlideMenu.scss'

const Tile = ({ slide, currentId, onSelect, child = false }) => (
    <button
        type="button"
        className={`isa-menu__tile${child ? ' isa-menu__tile--child' : ''}${slide.id === currentId ? ' is-active' : ''}`}
        aria-current={slide.id === currentId ? 'true' : undefined}
        onClick={() => onSelect(slide.id)}
    >
        <span className="isa-menu__tile-num">{slide.number}</span>
        <span className="isa-menu__tile-title">{slide.title}</span>
    </button>
)

/**
 * Slide navigator, rendered inside the reusable Modal. Single tiles share
 * grid rows; a section with children spans the full row as a group — its
 * overview tile first, then its child tiles (03, 03.1, 03.2…).
 */
const SlideMenu = ({ open, sections, currentId, onSelect, onClose, disclaimer }) => (
    <Modal isOpen={open} onClose={onClose} title="Slides" size="lg">
        <div className="isa-menu">
            {sections.map((section) =>
                section.children.length ? (
                    <section
                        key={section.id}
                        className="isa-menu__group"
                        aria-label={`${section.number} ${section.title}`}
                    >
                        <Tile slide={section} currentId={currentId} onSelect={onSelect} />
                        <div className="isa-menu__children">
                            {section.children.map((child) => (
                                <Tile key={child.id} slide={child} currentId={currentId} onSelect={onSelect} child />
                            ))}
                        </div>
                    </section>
                ) : (
                    <Tile key={section.id} slide={section} currentId={currentId} onSelect={onSelect} />
                )
            )}
        </div>

        {disclaimer && <p className="isa-menu__disclaimer">{disclaimer}</p>}
    </Modal>
)

export default SlideMenu
