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
        footnote: 'Illustrative sample data for demonstration only.',
        overview: 'Rapid, durable skin clearance versus placebo and an active comparator across the sample pivotal study.',
        studyDesign:
            'Sample randomized, double-blind, placebo- and active-controlled study (N=820) in adults with moderate-to-severe plaque psoriasis. Figures shown are fictional.',
        studyFacts: [
            { label: 'Patients', value: 'N=820' },
            { label: 'Randomization', value: '3:2:1 Lumvera, comparator, placebo' },
            { label: 'Primary endpoints', value: 'PASI 90 and sPGA 0/1 at Week 16' },
            { label: 'Duration', value: '52 weeks' },
        ],
        // Study arms = chart columns, in display order. `highlight` marks the
        // product arm (accent colour).
        arms: [
            { id: 'lumvera', label: 'Lumvera', highlight: true },
            { id: 'comparator', label: 'Active comparator' },
            { id: 'placebo', label: 'Placebo' },
        ],
        // One dataset per endpoint tab: % of patients responding at Week 16,
        // keyed by arm id. `defaultEndpoint` is the headline (overview tile +
        // first tab shown).
        defaultEndpoint: 'pasi90',
        endpoints: [
            { id: 'pasi90', label: 'PASI 90', title: 'PASI 90 response at Week 16', values: { lumvera: 71, comparator: 47, placebo: 6 } },
            { id: 'spga01', label: 'sPGA 0/1', title: 'sPGA 0/1 (clear or almost clear) at Week 16', values: { lumvera: 84, comparator: 61, placebo: 8 } },
            { id: 'pasi75', label: 'PASI 75', title: 'PASI 75 response at Week 16', values: { lumvera: 89, comparator: 70, placebo: 10 } },
            { id: 'pasi100', label: 'PASI 100', title: 'PASI 100 (complete clearance) at Week 16', values: { lumvera: 42, comparator: 20, placebo: 1 } },
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
        overview: 'Two initiation doses, then maintenance every 12 weeks.',
        // Weeks with a dose, for the regimen timeline.
        schedule: [0, 4, 16, 28, 40, 52],
        regimen: [
            { phase: 'Initiation', detail: '150 mg at Weeks 0 and 4' },
            { phase: 'Maintenance', detail: '150 mg every 12 weeks' },
        ],
        notes: ['Subcutaneous injection', 'Self-administered after training'],
        administration: [
            { title: 'Prepare', text: 'Let the prefilled pen reach room temperature for 30 minutes.' },
            { title: 'Inject', text: 'Thigh, abdomen or upper arm; rotate sites each dose.' },
            { title: 'Dispose', text: 'Place the used pen in a sharps container.' },
        ],
    },

    safety: {
        overview: 'Well-characterized safety profile in the sample study (illustrative).',
        common: ['Upper respiratory infection', 'Injection-site reaction', 'Headache'],
        // Incidence (%) through Week 16 — illustrative.
        adverseReactions: [
            { name: 'Upper respiratory infection', lumvera: 8.4, placebo: 6.1 },
            { name: 'Injection-site reaction', lumvera: 3.2, placebo: 1.0 },
            { name: 'Headache', lumvera: 2.9, placebo: 2.3 },
        ],
        warning: 'Do not administer to patients with a clinically important active infection (illustrative).',
        warnings: [
            { title: 'Infections', text: 'May increase the risk of infection. Do not start during an active infection.' },
            { title: 'Tuberculosis', text: 'Evaluate for TB before treatment; do not give with active TB.' },
            { title: 'Vaccinations', text: 'Avoid live vaccines during treatment.' },
        ],
    },

    // References are per-slide so each tile opens only its own citations.
    // A child slide without its own entry falls back to its parent's.
    references: {
        cover: ['Prescribing information (fictional). Lumvera. 2026.'],
        moa: ['Author A, et al. Journal of Illustrative Dermatology. 2026;12(3):100–110.'],
        efficacy: [
            'Author A, et al. Journal of Illustrative Dermatology. 2026;12(3):100–110.',
            'Data on file, Lumvera (fictional product). 2026.',
        ],
        'efficacy-design': ['Data on file, Lumvera (fictional product). 2026.'],
        dosing: ['Prescribing information (fictional). Lumvera. 2026.'],
        safety: ['Author B, et al. Sample Clinical Trials Review. 2025;8(1):22–30.'],
    },

    summary: {
        headline: 'Why Lumvera',
        // Each point: headline (always visible) + detail (expands) + the
        // slide holding its supporting data.
        points: [
            {
                headline: '71% PASI 90 response at Week 16 vs 6% with placebo',
                detail: 'Sample pivotal study, N=820. Response builds from Week 4 and continues through Week 16 (illustrative).',
                slideId: 'efficacy-primary',
            },
            {
                headline: 'Simple maintenance dosing — every 12 weeks after initiation',
                detail: '150 mg at Weeks 0 and 4, then every 12 weeks: 6 doses in the first year, self-administered with a prefilled pen.',
                slideId: 'dosing-regimen',
            },
            {
                headline: 'Well-characterized safety profile',
                detail: 'Most common: upper respiratory infection (8.4%), injection-site reaction (3.2%) and headache (2.9%), vs 6.1%, 1.0% and 2.3% with placebo (illustrative).',
                slideId: 'safety-reactions',
            },
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

// The deck is a tree: any node may carry `children` (sub-slides). The shell
// flattens it in preorder (parent overview first, then its children) and
// numbers it 01, 02, 03, 03.1… — see utils/deck.js. `summary` is the one-line
// blurb shown on the parent's overview tiles.
export const deck = [
    { id: 'cover', title: 'Cover', component: 'cover' },
    { id: 'moa', title: 'Mechanism of Action', component: 'moa' },
    {
        id: 'efficacy',
        title: 'Efficacy',
        component: 'efficacy',
        children: [
            { id: 'efficacy-primary', title: 'Primary endpoints', component: 'efficacyPrimary', summary: 'PASI 90, sPGA 0/1, PASI 75, PASI 100' },
            { id: 'efficacy-over-time', title: 'Response over time', component: 'efficacyOverTime', summary: 'Week 0 to Week 16' },
            { id: 'efficacy-design', title: 'Study design', component: 'efficacyDesign', summary: 'Who was studied, and how' },
        ],
    },
    {
        id: 'dosing',
        title: 'Dosing',
        component: 'dosing',
        children: [
            { id: 'dosing-regimen', title: 'Regimen', component: 'dosingRegimen', summary: 'Initiation and maintenance' },
            { id: 'dosing-administration', title: 'Administration', component: 'dosingAdministration', summary: 'Prefilled pen, three steps' },
        ],
    },
    {
        id: 'safety',
        title: 'Safety',
        component: 'safety',
        children: [
            { id: 'safety-reactions', title: 'Adverse reactions', component: 'safetyReactions', summary: 'Most common, vs placebo' },
            { id: 'safety-warnings', title: 'Warnings', component: 'safetyWarnings', summary: 'Infections, TB, vaccines' },
        ],
    },
    { id: 'summary', title: 'Summary', component: 'summary' },
]
