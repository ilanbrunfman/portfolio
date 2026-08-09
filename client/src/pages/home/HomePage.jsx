import { useEffect, useMemo, useRef, useState } from 'react'
import ProjectCard from '@/pages/home/components/card/Card'
import ProjectModal from '@/pages/home/components/modal/Modal'
import Button from '@/components/ui/button/Button'
import { useDebouncedSearch } from '@/pages/home/hooks/useDebouncedSearch'
import { useFlipTransition } from '@/pages/home/hooks/useFlipTransition'
import { shuffle } from '@/pages/home/utils/shuffle'
import { portfolioProjects, filterOptions, filterCounts, searchableText } from '@/pages/home/data/projects'
import './HomePage.scss'

const HomePage = () => {
    const [activeProject, setActiveProject] = useState(null)
    const [activeFilter, setActiveFilter] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const filterRef = useRef(null)

    const shuffledProjects = useMemo(() => shuffle(portfolioProjects), [])

    const { gridRef, captureFlipState } = useFlipTransition([
        activeFilter,
        searchQuery /* triggers via debouncedQuery below, kept for clarity */
    ])

    const debouncedQuery = useDebouncedSearch(searchQuery, 250, captureFlipState)

    const visibleProjects = useMemo(() => {
        return shuffledProjects.filter((project) => {
            const matchesFilter = activeFilter === 'All' || project.tags.includes(activeFilter)
            const matchesSearch = debouncedQuery === '' || searchableText(project).includes(debouncedQuery)
            return matchesFilter && matchesSearch
        })
    }, [shuffledProjects, activeFilter, debouncedQuery])

    const handleFilterClick = (option) => {
        captureFlipState()
        setActiveFilter(option)
    }

    const handleFilterSelect = (option) => {
        handleFilterClick(option)
        setIsFilterOpen(false)
    }

    // close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // close dropdown on Escape
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') setIsFilterOpen(false)
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [])

    return (
        <div className="home">
            {/* ---- showcase: title, subtitle ---- */}
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
            </section>

            {/* ---- toolbar: search + filter dropdown, same row ---- */}
            <section className="home__toolbar container">
                <div className="row">
                    <div className="col-12">
                        <div className="home__controls">
                            <div className="home__search">
                                <svg
                                    className="home__search-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <circle cx="11" cy="11" r="7" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>

                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search projects…"
                                    aria-label="Search projects"
                                />
                                {searchQuery && (
                                    <Button
                                        icon="IconX"
                                        variant="ghost"
                                        className="home__search-clear"
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Clear search"
                                    />
                                )}
                            </div>

                            <div className="home__filter-dropdown" ref={filterRef}>
                                <Button
                                    variant="ghost"
                                    className="home__filter-trigger"
                                    icon="IconChevronRight"
                                    iconPosition="right"
                                    onClick={() => setIsFilterOpen((prev) => !prev)}
                                    aria-haspopup="listbox"
                                    aria-expanded={isFilterOpen}
                                >
                                    <span className="home__filter-trigger-content">
                                        <span className="home__filter-trigger-label">{activeFilter}</span>
                                        <span className="home__filter-trigger-count">{filterCounts[activeFilter] ?? 0}</span>
                                    </span>
                                </Button>

                                {isFilterOpen && (
                                    <ul className="home__filter-list" role="listbox" aria-label="Filter projects by stack">
                                        {filterOptions.map((option) => (
                                            <li key={option}>
                                                <Button
                                                    variant="ghost"
                                                    className={`home__filter-option${activeFilter === option ? ' is-active' : ''}`}
                                                    onClick={() => handleFilterSelect(option)}
                                                    role="option"
                                                    aria-selected={activeFilter === option}
                                                >
                                                    <span className="home__filter-option-content">
                                                        <span className="home__filter-option-label">{option}</span>
                                                        <span className="home__filter-option-count">{filterCounts[option] ?? 0}</span>
                                                    </span>
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
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
                                <ProjectCard key={project.id} project={project} onOpen={setActiveProject} />
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

            {activeProject && <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />}
        </div>
    )
}

export default HomePage