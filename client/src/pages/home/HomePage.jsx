import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import ProjectCard from './ProjectCard'
import ProjectModal from './ProjectModal'
import './HomePage.scss'

gsap.registerPlugin(Flip)

// Fisher-Yates — unbiased shuffle, doesn't mutate the input array.
const shuffle = (array) => {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

// Heights vary in the URL on purpose (900, 1500, 800, 1050, 1600, 900) just
// to demonstrate the masonry effect with Picsum's placeholder service.
// No width/height fields here anymore — ProjectCard measures the real
// image once it loads, so there's nothing to keep in sync by hand.
//
// `preview` is optional — add it once you have a short screen recording
// or GIF for a project. Tiles without it just behave as static images.
// Project 1 below points at a short (10s, 640x360, ~1MB) Big Buck Bunny
// clip hosted on the Internet Archive — verified working.
const portfolioProjects = [
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
        link: '#'
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
const filterOptions = [
    'All',
    ...portfolioProjects.reduce((tags, project) => {
        project.tags.forEach((tag) => {
            if (!tags.includes(tag)) tags.push(tag)
        })
        return tags
    }, [])
]

const searchableText = (project) =>
    [project.title, project.tags.join(' '), project.description].join(' ').toLowerCase()

const HomePage = () => {
    const [activeProject, setActiveProject] = useState(null)
    const [activeFilter, setActiveFilter] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')

    const gridRef = useRef(null)
    const flipStateRef = useRef(null)
    const isFirstRender = useRef(true)

    const shuffledProjects = useMemo(() => shuffle(portfolioProjects), [])

    useEffect(() => {
        const id = setTimeout(() => {
            if (gridRef.current) {
                flipStateRef.current = Flip.getState(gridRef.current.children)
            }
            setDebouncedQuery(searchQuery.trim().toLowerCase())
        }, 250)

        return () => clearTimeout(id)
    }, [searchQuery])

    const visibleProjects = useMemo(() => {
        return shuffledProjects.filter((project) => {
            const matchesFilter = activeFilter === 'All' || project.tags.includes(activeFilter)
            const matchesSearch = debouncedQuery === '' || searchableText(project).includes(debouncedQuery)
            return matchesFilter && matchesSearch
        })
    }, [shuffledProjects, activeFilter, debouncedQuery])

    const handleFilterClick = (option) => {
        if (gridRef.current) {
            flipStateRef.current = Flip.getState(gridRef.current.children)
        }
        setActiveFilter(option)
    }

    useLayoutEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        if (!flipStateRef.current || !gridRef.current) return

        Flip.from(flipStateRef.current, {
            targets: gridRef.current.children,
            duration: 0.5,
            ease: 'power2.inOut',
            stagger: 0.02,
            absolute: true,
            onEnter: (elements) =>
                gsap.fromTo(
                    elements,
                    { opacity: 0, scale: 0.92 },
                    { opacity: 1, scale: 1, duration: 0.4, stagger: 0.03 }
                ),
            onLeave: (elements) =>
                gsap.to(elements, { opacity: 0, scale: 0.92, duration: 0.3 })
        })

        flipStateRef.current = null
    }, [visibleProjects])

    return (
        <div className="home">
            {/* ---- showcase: title, subtitle, search ---- */}
            <section className="home__showcase container">
                <div className="row">
                    <div className="col-12">
                        <span className="home__eyebrow">// portfolio</span>
                        <h1 className="home__title">Selected work</h1>
                        <p className="home__subtitle">
                            {visibleProjects.length} of {shuffledProjects.length} projects. Click a tile to see the build.
                        </p>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12 mb-2">
                        <div className="home__search">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search projects…"
                                aria-label="Search projects"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="home__search-clear"
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- toolbar: filter pills ---- */}
            <section className="home__toolbar container">
                <div className="row">
                    <div className="col-12 mb-2">
                        <div className="home__filters" role="radiogroup" aria-label="Filter projects by stack">
                            {filterOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    role="radio"
                                    aria-checked={activeFilter === option}
                                    className={`home__filter${activeFilter === option ? ' is-active' : ''}`}
                                    onClick={() => handleFilterClick(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- portfolio: the grid ---- */}
            <section className="home__portfolio container">
                <div className="row">
                    <div className="col-12">
                        <div className="home__grid" ref={gridRef}>
                            {visibleProjects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onOpen={setActiveProject}
                                />
                            ))}
                        </div>

                        {visibleProjects.length === 0 && (
                            <p className="home__empty">
                                No projects match {searchQuery ? `"${searchQuery}"` : `"${activeFilter}"`}.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {activeProject && (
                <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />
            )}
        </div>
    )
}

export default HomePage