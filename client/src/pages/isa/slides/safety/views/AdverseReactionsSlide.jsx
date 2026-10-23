const AdverseReactionsSlide = ({ data, slide }) => (
    <div className="isa-canvas d-flex flex-column gap-2">
        <div className="d-flex flex-column gap-1">
            <span className="isa-eyebrow">{slide.number} · Safety</span>
            <h2 className="isa-h2">Most common adverse reactions</h2>
        </div>

        <div className="surface isa-table-wrap">
            <table className="isa-table">
                <caption>Incidence through Week 16 (illustrative)</caption>
                <thead>
                    <tr>
                        <th scope="col">Adverse reaction</th>
                        <th scope="col">Lumvera</th>
                        <th scope="col">Placebo</th>
                    </tr>
                </thead>
                <tbody>
                    {data.safety.adverseReactions.map((r) => (
                        <tr key={r.name}>
                            <th scope="row">{r.name}</th>
                            <td>{r.lumvera.toFixed(1)}%</td>
                            <td>{r.placebo.toFixed(1)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <p className="isa-footnote">See the Important Safety Information in the top bar for more.</p>
    </div>
)

export default AdverseReactionsSlide
