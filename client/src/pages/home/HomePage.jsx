const portfolioProjects = [
    {
        id: 1,
        title: "Brunfman Properties",
        description: "Real estate management platform built with modern full-stack technologies.",
        image: "/images/projects/brunfman-properties.png",
        tags: ["React", "TypeScript", "Node.js"],
        link: "#"
    },
    {
        id: 2,
        title: "Veeva CLM Platform",
        description: "Enterprise Closed Loop Marketing applications for life sciences.",
        image: "/images/projects/veeva-clm.png",
        tags: ["Vue", "JavaScript", "SCSS"],
        link: "#"
    },
    {
        id: 3,
        title: "E-Commerce Store",
        description: "Responsive shopping experience with product browsing and checkout flow.",
        image: "/images/projects/ecommerce.png",
        tags: ["React", "Redux", "API"],
        link: "#"
    },
    {
        id: 4,
        title: "Task Management App",
        description: "A productivity app for organizing projects and daily tasks.",
        image: "/images/projects/tasks.png",
        tags: ["React", "Firebase", "CSS"],
        link: "#"
    },
    {
        id: 5,
        title: "Weather Dashboard",
        description: "Weather application using external APIs with location search.",
        image: "/images/projects/weather.png",
        tags: ["JavaScript", "API", "HTML"],
        link: "#"
    },
    {
        id: 6,
        title: "Fitness Tracker",
        description: "Workout tracking application for monitoring fitness progress.",
        image: "/images/projects/fitness.png",
        tags: ["React", "TypeScript", "Charts"],
        link: "#"
    },
    {
        id: 7,
        title: "Movie Database",
        description: "Movie discovery application with search and favorites.",
        image: "/images/projects/movies.png",
        tags: ["React", "TMDB API", "CSS"],
        link: "#"
    },
    {
        id: 8,
        title: "Personal Finance App",
        description: "Track expenses, budgets, and financial goals.",
        image: "/images/projects/finance.png",
        tags: ["Vue", "Pinia", "Charts"],
        link: "#"
    },
    {
        id: 9,
        title: "Portfolio Website",
        description: "Personal developer portfolio showcasing projects and experience.",
        image: "/images/projects/portfolio.png",
        tags: ["React", "SCSS", "Vite"],
        link: "#"
    }
];

import './HomePage.scss';

const HomePage = () => {
    return (
        <div className="home">
            <div className="container">
                <div className="row">
                    {portfolioProjects.map((project) => (
                        <div className="col-12 col-md-6 col-lg-4" key={project.id}>
                            <div className="card">
                                <img 
                                    src={project.image} 
                                    alt={project.title}
                                />

                                <div className="card-body">
                                    <h3>{project.title}</h3>
                                    <p>{project.description}</p>

                                    <div className="tags">
                                        {project.tags.map((tag) => (
                                            <span key={tag}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomePage;