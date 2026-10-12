/**
 * Important Safety Information body, rendered inside the full-page ISI modal.
 * (The modal title shows isi.title.)
 */
const IsiContent = ({ isi }) => (
    <div className="isa-isi">
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
