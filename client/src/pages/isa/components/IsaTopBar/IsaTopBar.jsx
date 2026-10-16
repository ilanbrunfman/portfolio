import Icon from '@/components/ui/icon/Icon'
import './IsaTopBar.scss'

const IsaTopBar = ({ brand, isiOpen, onToggleIsi, onReferences, hasReferences, onMenu }) => (
    <header className="isa-topbar">
        <div className="isa-topbar__bar">
            <span className="isa-topbar__brand">{brand}</span>
            <div className="isa-topbar__actions">
                <button
                    type="button"
                    className={`isa-topbar__menu${isiOpen ? ' is-active' : ''}`}
                    onClick={onToggleIsi}
                    aria-expanded={isiOpen}
                >
                    ISI
                </button>
                {hasReferences && (
                    <button type="button" className="isa-topbar__menu" onClick={onReferences}>
                        References
                    </button>
                )}
                <button
                    type="button"
                    className="isa-topbar__menu isa-topbar__menu--primary"
                    onClick={onMenu}
                    aria-haspopup="dialog"
                >
                    <Icon name="IconList" size={18} /> Slides
                </button>
            </div>
        </div>
    </header>
)

export default IsaTopBar
