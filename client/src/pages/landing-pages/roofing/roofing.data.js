// All copy/content for the roofing lander lives here so the page is pure
// composition. Swap this file (and the accent tokens) to spin up another
// brand on the same sections.

export const roofingContent = {
    brand: 'Summit Roofing',
    phone: '(555) 123-7663',

    nav: [
        { label: 'Services', href: '#services' },
        { label: 'Why us', href: '#why' },
        { label: 'Reviews', href: '#reviews' },
        { label: 'Contact', href: '#contact' },
    ],
    headerCta: { label: 'Free quote', href: '#contact' },

    hero: {
        eyebrow: 'Licensed & insured · 24/7 emergency service',
        title: 'Roof leaking or shingles missing? Get a fast, free inspection.',
        subtitle:
            'Trusted local roofers for repairs, replacements, and storm damage — honest pricing and no pressure.',
        primaryCta: { label: 'Get a free quote', href: '#contact' },
        secondaryCta: { label: 'View services', href: '#services' },
        trust: '15+ years · 1,200+ roofs · 4.9★ average rating',
        bgImage: 'https://picsum.photos/1600/900?grayscale&blur=2&random=10',
    },

    trust: ['Licensed & insured', 'BBB A+ accredited', 'GAF certified', '4.9★ Google rating'],

    services: {
        eyebrow: 'What we do',
        title: 'Comprehensive roofing solutions',
        lead: 'From a single leak to a full replacement, we handle every kind of residential roof.',
        items: [
            { icon: 'IconHome', title: 'Roof replacement', text: 'Full tear-off and installation with premium, warranty-backed materials.', href: '#contact' },
            { icon: 'IconStack', title: 'Roof repair', text: 'Fast fixes for leaks, missing shingles, and flashing before they get worse.', href: '#contact' },
            { icon: 'IconSun', title: 'Storm damage', text: 'Emergency tarping and full insurance-claim support after wind and hail.', href: '#contact' },
            { icon: 'IconMagnifyingGlass', title: 'Free inspections', text: 'A thorough, no-pressure assessment with photos and an itemized quote.', href: '#contact' },
            { icon: 'IconLayout', title: 'Flat & commercial', text: 'Durable membrane systems for flat and low-slope roofs.', href: '#contact' },
            { icon: 'IconList', title: 'Gutters & fascia', text: 'Seamless gutters, fascia, and soffit to protect your roofline.', href: '#contact' },
        ],
    },

    stats: [
        { value: '15+', label: 'Years in business' },
        { value: '1,200+', label: 'Roofs completed' },
        { value: '4.9★', label: 'Average rating' },
        { value: '24/7', label: 'Emergency service' },
    ],

    about: {
        eyebrow: 'Our story',
        title: 'A family legacy built on trust',
        body: [
            'Since 2010 we’ve helped homeowners protect what matters most with honest workmanship and straightforward advice.',
            'From the first inspection to the final nail you’ll work with the same local crew — no subcontractors, no runaround.',
        ],
        image: 'https://picsum.photos/800/600?random=11',
        imageAlt: 'Roofing crew installing new shingles',
        cta: { label: 'Get your free quote', href: '#contact' },
    },

    why: {
        eyebrow: 'Why choose us',
        title: 'Roofing done right, the first time',
        columns: 3,
        items: [
            { icon: 'IconUser', title: 'Local & family-owned', text: 'Your neighbors, not a national call center. We stand behind every job.' },
            { icon: 'IconCards', title: 'Transparent pricing', text: 'Clear, itemized quotes — no surprises and no high-pressure sales.' },
            { icon: 'IconStack', title: 'Warranty-backed', text: 'Manufacturer and workmanship warranties on every installation.' },
        ],
    },

    testimonials: {
        eyebrow: 'Reviews',
        title: 'Trusted by local homeowners',
        items: [
            { quote: 'They found the leak three other companies missed and fixed it the same day. Honest and fast.', name: 'Sarah M.', meta: 'Roof repair · Google' },
            { quote: 'New roof looks incredible and the crew cleaned up spotless. Pricing was exactly as quoted.', name: 'David R.', meta: 'Roof replacement · Google' },
            { quote: 'After the storm they tarped our roof that night and handled the whole insurance claim.', name: 'Priya K.', meta: 'Storm damage · Facebook' },
        ],
    },

    cta: {
        title: 'Book your free roof inspection',
        text: 'No pressure, no obligation — just a clear assessment and an honest quote.',
        cta: { label: 'Get a free quote', href: '#contact' },
    },

    contact: {
        eyebrow: 'Get in touch',
        title: 'Get your free roof quote',
        lead: 'Tell us what’s going on and we’ll get back to you within one business day.',
    },

    footer: {
        brand: 'Summit Roofing',
        blurb: 'Honest, local roofing for repairs, replacements, and storm damage.',
        phone: '(555) 123-7663',
        email: 'hello@summitroofing.example',
        license: '© 2026 Summit Roofing. Licensed & insured. All rights reserved.',
        columns: [
            { title: 'Services', links: [{ label: 'Roof replacement', href: '#services' }, { label: 'Roof repair', href: '#services' }, { label: 'Storm damage', href: '#services' }, { label: 'Inspections', href: '#services' }] },
            { title: 'Company', links: [{ label: 'Why us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'Contact', href: '#contact' }] },
            { title: 'Get started', links: [{ label: 'Free quote', href: '#contact' }] },
        ],
    },
}
