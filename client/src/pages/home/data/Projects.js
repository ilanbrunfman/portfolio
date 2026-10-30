import roofingThumb from '@/assets/thumbnails/roofing.webp'
import todosThumb from '@/assets/thumbnails/todos.svg'
import isaThumb from '@/assets/thumbnails/isa.svg'
// Bank Tracker: still poster (first frame) + a short recording played on hover
import bankPoster from '@/assets/thumbnails/bank.webp'
import bankGif from '@/assets/thumbnails/bank.gif'
// Ta'im: the floor as a still poster + a phone recording played on hover
// (pick the waiter, add a dessert, send it, the cook starts and serves it)
import taimPoster from '@/assets/thumbnails/taim.webp'
import taimGif from '@/assets/thumbnails/taim.gif'

// Heights vary in the URL on purpose (900, 1500, 800, 1050, 1600, 900) just
// to demonstrate the masonry effect with Picsum's placeholder service.
// No width/height fields here anymore — ProjectCard measures the real
// image once it loads, so there's nothing to keep in sync by hand.
//
// `id` is a readable slug: unique and stable (used as the React key; keep it
// unchanged once shared, in case it ends up in a link).
//
// `preview` is optional — add it once you have a short screen recording
// or GIF for a project. Tiles without it just behave as static images.
export const portfolioProjects = [
    {
        id: 'brunfman-properties',
        title: 'Brunfman Properties',
        description: 'Real estate management platform built with modern full-stack technologies.',
        image: 'https://picsum.photos/1200/900?1',
        preview: {
            type: 'video',
            src: 'https://archive.org/download/lkajsdasa/Big_Buck_Bunny_360_10s_1MB.ia.mp4'
        },
        tags: ['React', 'TypeScript', 'Node.js'],
        link: '#'
    },
    // {
    //     id: 'veeva-clm',
    //     title: 'Veeva CLM Platform',
    //     description: 'Enterprise Closed Loop Marketing applications for life sciences.',
    //     image: 'https://picsum.photos/1200/1500?2',
    //     tags: ['Vue', 'JavaScript', 'SCSS'],
    //     link: '#'
    // },
    // {
    //     id: 'ecommerce-store',
    //     title: 'E-Commerce Store',
    //     description: 'Responsive shopping experience with product browsing and checkout flow.',
    //     image: 'https://picsum.photos/1200/800?3',
    //     tags: ['React', 'Redux', 'API'],
    //     link: '#'
    // },
    {
        id: 'todos',
        title: 'Task Management App',
        description: 'A productivity app for organizing projects and daily tasks.',
        image: todosThumb,
        tags: ['React', 'Firebase', 'CSS'],
        link: '#',
        route: 'todos',
        // route: '/projects/task-management-app',
    },
    // {
    //     id: 'weather-dashboard',
    //     title: 'Weather Dashboard',
    //     description: 'Weather application using external APIs with location search.',
    //     image: 'https://picsum.photos/1200/1600?5',
    //     tags: ['JavaScript', 'API', 'HTML'],
    //     link: '#'
    // },
    // {
    //     id: 'portfolio-website',
    //     title: 'Portfolio Website',
    //     description: 'Personal developer portfolio showcasing projects and experience.',
    //     image: 'https://picsum.photos/1200/900?6',
    //     tags: ['React', 'SCSS', 'Vite'],
    //     link: '#'
    // },
    {
        id: 'summit-roofing',
        title: 'Summit Roofing — Landing Page',
        description: 'High-converting roofing landing page composed from a reusable section system.',
        image: roofingThumb,
        tags: ['React', 'SCSS', 'Landing Page'],
        link: '#',
        route: '/roofing',
    },
    {
        id: 'lumvera-isa',
        title: 'Lumvera ISA — Interactive Sales Aid',
        description: 'Swipeable pharma CLM detail aid with per-slide references, ISI, and quarterly-updatable efficacy data.',
        image: isaThumb,
        tags: ['React', 'GSAP', 'CLM'],
        link: '#',
        route: '/isa',
    },
    {
        id: 'bank-tracker',
        title: 'Bank Tracker',
        description: 'Full-stack app to track bank accounts, transactions and transfers, with login, filters and a monthly summary.',
        image: bankPoster,
        preview: { type: 'gif', src: bankGif },
        tags: ['React', 'Node.js', 'PostgreSQL'],
        link: '#',
        route: '/bank',
    },
    {
        id: 'taim',
        title: "Ta'im — Restaurant App",
        description: 'Full-stack restaurant system: floor, orders, a live kitchen screen, bills and end of day, and what dishes that come back cost. Five roles, each seeing its own screens.',
        image: taimPoster,
        preview: { type: 'gif', src: taimGif },
        tags: ['React', 'Node.js', 'PostgreSQL'],
        link: '#',
        route: '/taim',
    }
]

// Unique tags across every project, in first-appearance order, with an
// "All" option prepended.
export const filterOptions = [
    'All',
    ...portfolioProjects.reduce((tags, project) => {
        project.tags.forEach((tag) => {
            if (!tags.includes(tag)) tags.push(tag)
        })
        return tags
    }, [])
]

// How many projects match each filter option — shown next to the label,
// same idea as "Wallpaper 69K" in the reference.
export const filterCounts = portfolioProjects.reduce(
    (counts, project) => {
        project.tags.forEach((tag) => {
            counts[tag] = (counts[tag] || 0) + 1
        })
        return counts
    },
    { All: portfolioProjects.length }
)

export const searchableText = (project) =>
    [project.title, project.tags.join(' '), project.description].join(' ').toLowerCase()