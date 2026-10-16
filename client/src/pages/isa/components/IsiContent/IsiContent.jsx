import './IsiContent.scss'

/**
 * Important Safety Information body, rendered inside the full-page ISI modal.
 * (The modal title shows isi.title.)
 */
const IsiContent = ({ isi }) => (
    <div className="isa-isi d-flex flex-column gap-1">
        <p>{isi.summary}</p>
        {isi.sections.map((section) => (
            <div key={section.heading}>
                <h4>{section.heading}</h4>
                <p>{section.text}</p>
            </div>
        ))}
    </div>
)

export default IsiContent
