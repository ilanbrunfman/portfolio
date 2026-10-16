import Icon from '@/components/ui/icon/Icon'
import coverImage from '@/assets/isa/lumvera-cover.svg'

const CoverSlide = ({ data }) => (
    <div className="isa-canvas isa-cover">
        <div className="row">
            <div className="col-12 d-grid grid-7-5 gap-3">
                <div className="d-flex flex-column gap-1 justify-center">
                    <Icon name="IconStack" size={48} className="isa-cover__icon" />
                    <span className="isa-eyebrow">Interactive sales aid · demo</span>
                    <h1 className="isa-h1">
                        {data.name}{data.tm}
                    </h1>
                    <p className="isa-lead" style={{ color: 'rgba(255,255,255,0.88)', maxWidth: '52ch' }}>
                        {data.tagline}. Indicated for {data.indication}.
                    </p>
                    <span
                        className="isa-badge"
                        style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                    >
                        Swipe or use the arrows to explore →
                    </span>
                </div>

                <div className="d-flex align-items-center justify-center">
                    <img className="isa-cover__image" src={coverImage} alt="" />
                </div>
            </div>
        </div>
    </div>
)

export default CoverSlide
