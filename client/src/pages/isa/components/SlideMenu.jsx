import Modal from '@/components/ui/modal/Modal'

/**
 * Slide navigator, rendered inside the reusable Modal. Tiles are flat for v1
 * but the slides array is already parent-aware (parentId) for future nesting.
 */
const SlideMenu = ({ open, slides, currentId, onSelect, onClose, disclaimer }) => (
    <Modal isOpen={open} onClose={onClose} title="Slides" size="lg">
        <div className="isa-menu">
            {slides.map((slide, i) => (
                <button
                    key={slide.id}
                    type="button"
                    className={`isa-menu__tile${slide.id === currentId ? ' is-active' : ''}`}
                    onClick={() => onSelect(slide.id)}
                >
                    <span className="isa-menu__tile-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="isa-menu__tile-title">{slide.title}</span>
                </button>
            ))}
        </div>

        {disclaimer && (
            <p style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text)', lineHeight: 1.5 }}>
                {disclaimer}
            </p>
        )}
    </Modal>
)

export default SlideMenu
