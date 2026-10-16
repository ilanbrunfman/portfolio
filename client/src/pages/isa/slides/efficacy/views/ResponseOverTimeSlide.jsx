import { useState } from 'react'

// Chart geometry (SVG user units; the SVG scales to its container).
const W = 640
const H = 300
const M = { top: 16, right: 96, bottom: 36, left: 44 }
const PLOT_W = W - M.left - M.right
const PLOT_H = H - M.top - M.bottom
const Y_TICKS = [0, 25, 50, 75, 100]

const SERIES = [
    { key: 'lumvera', label: 'Lumvera', className: 'is-primary' },
    { key: 'placebo', label: 'Placebo', className: 'is-comparator' },
]

const ResponseOverTimeSlide = ({ data, slide }) => {
    const { efficacy } = data
    const points = efficacy.overTime
    const [hover, setHover] = useState(null) // index into points

    const maxWeek = points[points.length - 1].week
    const x = (week) => M.left + (week / maxWeek) * PLOT_W
    const y = (pct) => M.top + PLOT_H - (pct / 100) * PLOT_H
    const path = (key) => points.map((p, i) => `${i ? 'L' : 'M'}${x(p.week)},${y(p[key])}`).join(' ')

    // Crosshair snaps to the nearest week.
    const handleMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const svgX = ((e.clientX - rect.left) / rect.width) * W
        let nearest = 0
        points.forEach((p, i) => {
            if (Math.abs(x(p.week) - svgX) < Math.abs(x(points[nearest].week) - svgX)) nearest = i
        })
        setHover(nearest)
    }

    const last = points[points.length - 1]
    const active = hover != null ? points[hover] : null

    return (
        <div className="isa-canvas d-flex flex-column gap-2">
            <div className="d-flex flex-column gap-1">
                <span className="isa-eyebrow">{slide.number} · Efficacy</span>
                <h2 className="isa-h2">PASI 90 response over time</h2>
                <span className="isa-badge">Data updated {efficacy.lastUpdated}</span>
            </div>

            <div className="surface d-flex flex-column gap-1">
                <ul className="isa-legend d-flex gap-1" aria-hidden="true">
                    {SERIES.map((s) => (
                        <li key={s.key} className={s.className}>
                            <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" /></svg>
                            {s.label}
                        </li>
                    ))}
                </ul>

                <div className="isa-line-chart">
                    <svg
                        viewBox={`0 0 ${W} ${H}`}
                        role="img"
                        aria-label={`PASI 90 response by week. At week ${last.week}: Lumvera ${last.lumvera}%, placebo ${last.placebo}%. Full values in the data table below.`}
                        onPointerMove={handleMove}
                        onPointerLeave={() => setHover(null)}
                    >
                        {/* grid + y axis */}
                        {Y_TICKS.map((t) => (
                            <g key={t}>
                                <line className="isa-line-chart__grid" x1={M.left} x2={M.left + PLOT_W} y1={y(t)} y2={y(t)} />
                                <text className="isa-line-chart__tick" x={M.left - 10} y={y(t)} textAnchor="end" dominantBaseline="middle">
                                    {t}%
                                </text>
                            </g>
                        ))}
                        {/* x axis */}
                        {points.map((p) => (
                            <text key={p.week} className="isa-line-chart__tick" x={x(p.week)} y={H - 12} textAnchor="middle">
                                Wk {p.week}
                            </text>
                        ))}

                        {active && (
                            <line className="isa-line-chart__crosshair" x1={x(active.week)} x2={x(active.week)} y1={M.top} y2={M.top + PLOT_H} />
                        )}

                        {SERIES.map((s) => (
                            <g key={s.key} className={`isa-line-chart__series ${s.className}`}>
                                <path d={path(s.key)} />
                                {points.map((p, i) => (
                                    <circle key={p.week} cx={x(p.week)} cy={y(p[s.key])} r={hover === i ? 5 : 4} />
                                ))}
                                {/* direct label at the line end */}
                                <text x={x(last.week) + 12} y={y(last[s.key])} dominantBaseline="middle">
                                    {s.label} {last[s.key]}%
                                </text>
                            </g>
                        ))}
                    </svg>

                    {active && (
                        <div
                            className="isa-line-chart__tooltip"
                            style={{ left: `${(x(active.week) / W) * 100}%` }}
                            aria-hidden="true"
                        >
                            <span className="isa-line-chart__tooltip-title">Week {active.week}</span>
                            {SERIES.map((s) => (
                                <span key={s.key} className={`isa-line-chart__tooltip-row ${s.className}`}>
                                    <svg width="14" height="8"><line x1="0" y1="4" x2="14" y2="4" /></svg>
                                    <strong>{active[s.key]}%</strong> {s.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <details className="isa-data-table">
                    <summary>Show data table</summary>
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Week</th>
                                {SERIES.map((s) => <th key={s.key} scope="col">{s.label}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {points.map((p) => (
                                <tr key={p.week}>
                                    <th scope="row">{p.week}</th>
                                    {SERIES.map((s) => <td key={s.key}>{p[s.key]}%</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </details>

                <p className="isa-footnote">{efficacy.footnote}</p>
            </div>
        </div>
    )
}

export default ResponseOverTimeSlide
