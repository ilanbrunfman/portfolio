// Fictional product content for the ISA demo. Efficacy numbers are illustrative
// sample data — bump `efficacy.lastUpdated` and the values each "quarter" to
// mirror an MLR-approved data refresh in real CLM work.

export const lumvera = {
    name: 'Lumvera',
    tm: '™',
    indication: 'moderate-to-severe plaque psoriasis in adults',
    tagline: 'Sustained skin clearance with convenient dosing',
    disclaimer:
        'Concept demo with AbbVie-inspired styling — not affiliated with or endorsed by AbbVie. “Lumvera” is a fictional product and all clinical data shown is illustrative sample data, not for medical use.',

    moa: {
        summary:
            'Lumvera selectively targets a key inflammatory cytokine, interrupting the signaling that drives plaque formation (illustrative).',
        steps: [
            { title: 'Selective binding', text: 'Binds the target cytokine with high affinity.' },
            { title: 'Signal interruption', text: 'Blocks downstream inflammatory signaling.' },
            { title: 'Reduced plaque', text: 'Lowers keratinocyte proliferation and skin inflammation.' },
        ],
    },

    efficacy: {
        lastUpdated: 'Q4 2026',
        primaryEndpoint: 'PASI 90 response at Week 16',
        footnote: 'Illustrative sample data for demonstration only.',
        studyDesign:
            'Sample randomized, double-blind, placebo-controlled study (N=820) in adults with moderate-to-severe plaque psoriasis. Figures shown are fictional.',
        series: [
            { label: 'Lumvera', value: 71, highlight: true },
            { label: 'Placebo', value: 6 },
        ],
        overTime: [
            { week: 0, lumvera: 0, placebo: 0 },
            { week: 4, lumvera: 28, placebo: 3 },
            { week: 8, lumvera: 54, placebo: 5 },
            { week: 12, lumvera: 66, placebo: 6 },
            { week: 16, lumvera: 71, placebo: 6 },
        ],
    },

    dosing: {
        headline: 'Simple, consistent dosing',
        regimen: [
            { phase: 'Initiation', detail: '150 mg at Weeks 0 and 4' },
            { phase: 'Maintenance', detail: '150 mg every 12 weeks' },
        ],
        notes: ['Subcutaneous injection', 'Self-administered after training'],
    },

    safety: {
        common: ['Upper respiratory infection', 'Injection-site reaction', 'Headache'],
        warning: 'Do not administer to patients with a clinically important active infection (illustrative).',
    },

    // References are per-slide so each tile opens only its own citations.
    references: {
        cover: ['Prescribing information (fictional). Lumvera. 2026.'],
        moa: ['Author A, et al. Journal of Illustrative Dermatology. 2026;12(3):100–110.'],
        efficacy: [
            'Author A, et al. Journal of Illustrative Dermatology. 2026;12(3):100–110.',
            'Data on file, Lumvera (fictional product). 2026.',
        ],
        dosing: ['Prescribing information (fictional). Lumvera. 2026.'],
        safety: ['Author B, et al. Sample Clinical Trials Review. 2025;8(1):22–30.'],
    },

    summary: {
        headline: 'Why Lumvera',
        points: [
            '71% PASI 90 response at Week 16 vs 6% with placebo (illustrative).',
            'Simple maintenance dosing — every 12 weeks after initiation.',
            'Well-characterized safety profile; common reactions only (illustrative).',
        ],
        closing: 'Consider whether Lumvera may be right for your patients.',
    },

    isi: {
        title: 'Important Safety Information',
        summary:
            'Sample Important Safety Information for a fictional product, shown for demonstration only — not for medical decisions.',
        sections: [
            { heading: 'Contraindications', text: 'Serious hypersensitivity to any component (illustrative).' },
            { heading: 'Warnings & Precautions', text: 'Increased risk of infection; evaluate for TB before initiation (illustrative).' },
            { heading: 'Adverse Reactions', text: 'Most common (≥1%): URTI, injection-site reactions, headache (illustrative).' },
        ],
    },
}

// The deck is a tree: any node may carry `children` (sub-slides). v1 is flat,
// but the shell flattens this recursively, so nesting is pure data later.
export const deck = [
    { id: 'cover', title: 'Cover', component: 'cover' },
    { id: 'moa', title: 'Mechanism of Action', component: 'moa' },
    { id: 'efficacy', title: 'Efficacy', component: 'efficacy' },
    { id: 'dosing', title: 'Dosing', component: 'dosing' },
    { id: 'safety', title: 'Safety', component: 'safety' },
    { id: 'summary', title: 'Summary', component: 'summary' },
]
