// Heights vary in the URL on purpose (900, 1500, 800, 1050, 1600, 900) just
// to demonstrate the masonry effect with Picsum's placeholder service.
// No width/height fields here anymore — ProjectCard measures the real
// image once it loads, so there's nothing to keep in sync by hand.
//
// `preview` is optional — add it once you have a short screen recording
// or GIF for a project. Tiles without it just behave as static images.
export const portfolioProjects = [
    {
        id: 1,
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
    {
        id: 2,
        title: 'Veeva CLM Platform',
        description: 'Enterprise Closed Loop Marketing applications for life sciences.',
        image: 'https://picsum.photos/1200/1500?2',
        tags: ['Vue', 'JavaScript', 'SCSS'],
        link: '#'
    },
    {
        id: 3,
        title: 'E-Commerce Store',
        description: 'Responsive shopping experience with product browsing and checkout flow.',
        image: 'https://picsum.photos/1200/800?3',
        tags: ['React', 'Redux', 'API'],
        link: '#'
    },
    {
        id: 4,
        title: 'Task Management App',
        description: 'A productivity app for organizing projects and daily tasks.',
        image: 'https://picsum.photos/1200/1050?4',
        tags: ['React', 'Firebase', 'CSS'],
        link: '#',
        route: 'todos',
        // route: '/projects/task-management-app',
    },
    {
        id: 5,
        title: 'Weather Dashboard',
        description: 'Weather application using external APIs with location search.',
        image: 'https://picsum.photos/1200/1600?5',
        tags: ['JavaScript', 'API', 'HTML'],
        link: '#'
    },
    {
        id: 6,
        title: 'Portfolio Website',
        description: 'Personal developer portfolio showcasing projects and experience.',
        image: 'https://picsum.photos/1200/900?6',
        tags: ['React', 'SCSS', 'Vite'],
        link: '#'
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